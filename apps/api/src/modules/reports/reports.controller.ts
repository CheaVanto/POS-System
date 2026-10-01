import { Controller, Get, Injectable, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrderStatus, Prisma } from '@prisma/client';
import { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SalesReportExportQueryDto,
  SalesReportQueryDto,
} from './dto/sales-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(companyId: string, branchId?: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const orderBranch = branchId ? { store: { branchId } } : {};
    const invBranch = branchId ? { warehouse: { branchId } } : {};
    const lowStockSql = branchId
      ? Prisma.sql`
          SELECT COUNT(*)::bigint AS count
          FROM "InventoryItem" ii
          JOIN "Warehouse" w ON w.id = ii."warehouseId"
          WHERE ii."companyId" = ${companyId} AND ii.quantity <= ii."reorderPoint"
            AND w."branchId" = ${branchId}`
      : Prisma.sql`
          SELECT COUNT(*)::bigint AS count
          FROM "InventoryItem" ii
          WHERE ii."companyId" = ${companyId} AND ii.quantity <= ii."reorderPoint"`;

    const [todayAgg, allTimeAgg, recentOrders, topGroups, inventoryRows, lowStock] =
      await Promise.all([
        this.prisma.order.aggregate({
          where: {
            companyId,
            status: OrderStatus.COMPLETED,
            completedAt: { gte: startOfToday },
            ...orderBranch,
          },
          _sum: { grandTotal: true, taxTotal: true },
          _count: true,
        }),
        this.prisma.order.aggregate({
          where: { companyId, status: OrderStatus.COMPLETED, ...orderBranch },
          _sum: { grandTotal: true },
          _count: true,
        }),
        this.prisma.order.findMany({
          where: { companyId, deletedAt: null, ...orderBranch },
          orderBy: { createdAt: 'desc' },
          take: 8,
          include: { customer: true, _count: { select: { items: true } } },
        }),
        this.prisma.orderItem.groupBy({
          by: ['productId', 'nameSnapshot'],
          where: { order: { companyId, status: OrderStatus.COMPLETED, ...orderBranch } },
          _sum: { quantity: true, lineTotal: true },
          orderBy: { _sum: { lineTotal: 'desc' } },
          take: 5,
        }),
        this.prisma.inventoryItem.findMany({
          where: { companyId, ...invBranch },
          select: { quantity: true, avgCost: true },
        }),
        this.prisma.$queryRaw<{ count: bigint }[]>(lowStockSql),
      ]);

    const inventoryValue = inventoryRows.reduce((sum, r) => sum + r.quantity * r.avgCost, 0);

    return {
      today: {
        orders: todayAgg._count,
        revenue: todayAgg._sum.grandTotal ?? 0,
        tax: todayAgg._sum.taxTotal ?? 0,
      },
      allTime: { orders: allTimeAgg._count, revenue: allTimeAgg._sum.grandTotal ?? 0 },
      inventoryValue,
      lowStockCount: Number(lowStock[0]?.count ?? 0),
      topProducts: topGroups.map((g) => ({
        productId: g.productId,
        name: g.nameSnapshot,
        quantity: g._sum.quantity ?? 0,
        revenue: g._sum.lineTotal ?? 0,
      })),
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        number: o.number,
        status: o.status,
        grandTotal: o.grandTotal,
        itemCount: o._count.items,
        customer: o.customer?.name ?? null,
        createdAt: o.createdAt,
      })),
    };
  }

  private resolveRange(fromStr?: string, toStr?: string) {
    const from = fromStr ? new Date(fromStr) : new Date(Date.now() - 30 * 864e5);
    let to: Date;
    if (toStr) {
      to = new Date(toStr);
      if (/^\d{4}-\d{2}-\d{2}$/.test(toStr)) to = new Date(to.getTime() + 864e5 - 1);
    } else {
      to = new Date();
    }
    return { from, to };
  }

  async salesReport(companyId: string, q: SalesReportQueryDto) {
    const { from, to } = this.resolveRange(q.from, q.to);

    const where = {
      companyId,
      status: OrderStatus.COMPLETED,
      completedAt: { gte: from, lte: to },
      ...(q.branchId ? { store: { branchId: q.branchId } } : {}),
    };

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        payments: { select: { method: true, amount: true } },
        _count: { select: { items: true } },
      },
      orderBy: { completedAt: 'desc' },
    });

    let gross = 0;
    let tax = 0;
    let discount = 0;
    const byMethod = new Map<string, { amount: number; count: number }>();
    const byDay = new Map<string, { orders: number; sales: number }>();

    for (const o of orders) {
      gross += o.grandTotal;
      tax += o.taxTotal;
      discount += o.discountTotal;
      for (const p of o.payments) {
        const m = byMethod.get(p.method) ?? { amount: 0, count: 0 };
        m.amount += p.amount;
        m.count += 1;
        byMethod.set(p.method, m);
      }
      const day = (o.completedAt ?? o.createdAt).toISOString().slice(0, 10);
      const d = byDay.get(day) ?? { orders: 0, sales: 0 };
      d.orders += 1;
      d.sales += o.grandTotal;
      byDay.set(day, d);
    }

    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      summary: {
        orders: orders.length,
        grossSales: gross,
        discountTotal: discount,
        taxTotal: tax,
        netSales: gross - tax,
        avgOrderValue: orders.length ? Math.round(gross / orders.length) : 0,
      },
      byPaymentMethod: [...byMethod.entries()].map(([method, v]) => ({ method, ...v })),
      byDay: [...byDay.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, v]) => ({ date, ...v })),
      rows: orders.map((o) => ({
        id: o.id,
        number: o.number,
        date: o.completedAt ?? o.createdAt,
        customer: o.customer?.name ?? 'Walk-in',
        items: o._count.items,
        subtotal: o.subtotal,
        discountTotal: o.discountTotal,
        taxTotal: o.taxTotal,
        grandTotal: o.grandTotal,
        payments: o.payments.map((p) => p.method).join(' + '),
        status: o.status,
      })),
    };
  }

  async salesReportCsv(companyId: string, q: SalesReportQueryDto): Promise<string> {
    const report = await this.salesReport(companyId, q);
    const money = (m: number) => (m / 100).toFixed(2);
    const esc = (v: unknown) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const header = ['Receipt', 'Date', 'Customer', 'Items', 'Subtotal', 'Discount', 'Tax', 'Total', 'Payments', 'Status'];
    const lines = [header.join(',')];
    for (const r of report.rows) {
      lines.push(
        [
          r.number,
          new Date(r.date).toISOString(),
          r.customer,
          r.items,
          money(r.subtotal),
          money(r.discountTotal),
          money(r.taxTotal),
          money(r.grandTotal),
          r.payments,
          r.status,
        ].map(esc).join(','),
      );
    }
    lines.push('');
    lines.push(['', '', '', '', '', '', 'Orders', report.summary.orders].map(esc).join(','));
    lines.push(['', '', '', '', '', '', 'Gross', money(report.summary.grossSales)].map(esc).join(','));
    lines.push(['', '', '', '', '', '', 'Discount', money(report.summary.discountTotal)].map(esc).join(','));
    lines.push(['', '', '', '', '', '', 'Tax', money(report.summary.taxTotal)].map(esc).join(','));
    lines.push(['', '', '', '', '', '', 'Net', money(report.summary.netSales)].map(esc).join(','));
    return lines.join('\n');
  }
}

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('dashboard')
  @Permissions('report:read')
  dashboard(
    @CurrentUser('companyId') companyId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reports.dashboard(companyId, branchId);
  }

  @Get('sales')
  @Permissions('report:read')
  salesReport(
    @CurrentUser('companyId') companyId: string,
    @Query() query: SalesReportQueryDto,
  ) {
    return this.reports.salesReport(companyId, query);
  }

  @Get('sales/export')
  @Permissions('report:read')
  @ApiOperation({ summary: 'Download the sales report as CSV' })
  async exportSales(
    @CurrentUser('companyId') companyId: string,
    @Query() query: SalesReportExportQueryDto,
    @Res() res: Response,
  ) {
    const csv = await this.reports.salesReportCsv(companyId, query);
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="sales-report-${stamp}.csv"`);
    res.send(csv);
  }
}
