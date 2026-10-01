import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, StockTxnKind } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { Money } from '../../common/money';
import { paginate, PaginationDto } from '../../common/dto/pagination.dto';
import { InventoryService } from '../inventory/inventory.service';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  async checkout(companyId: string, userId: string, dto: CheckoutDto) {
    const company = await this.prisma.company.findUniqueOrThrow({ where: { id: companyId } });

    const productIds = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, companyId, deletedAt: null },
    });
    const productById = new Map(products.map((p) => [p.id, p]));
    for (const item of dto.items) {
      if (!productById.has(item.productId)) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }
    }

    let subtotal = 0;
    let discountTotal = dto.orderDiscount ?? 0;
    let taxTotal = 0;

    const lines = dto.items.map((item) => {
      const p = productById.get(item.productId)!;
      const unitPrice = p.sellPrice;
      const discount = item.discount ?? 0;
      const net = Money.lineNet(unitPrice, item.quantity, discount);
      const taxRateBps = p.taxRateBps ?? company.taxRateBps;
      const taxAmount = Money.tax(net, taxRateBps);

      subtotal += unitPrice * item.quantity;
      discountTotal += discount;
      taxTotal += taxAmount;

      return {
        product: p,
        variantId: item.variantId ?? null,
        quantity: item.quantity,
        unitPrice,
        discount,
        taxRateBps,
        taxAmount,
        lineTotal: net + taxAmount,
      };
    });

    const grandTotal =
      subtotal - discountTotal + taxTotal + (dto.serviceCharge ?? 0) + (dto.tip ?? 0);

    const paidTotal = dto.payments.reduce((sum, p) => sum + p.amount, 0);
    if (paidTotal < grandTotal) {
      throw new BadRequestException(`Underpaid: paid ${paidTotal} of ${grandTotal} (minor units)`);
    }
    const cashTendered = dto.payments
      .filter((p) => p.method === 'CASH')
      .reduce((s, p) => s + (p.tendered ?? p.amount), 0);
    const nonCashPaid = dto.payments
      .filter((p) => p.method !== 'CASH')
      .reduce((s, p) => s + p.amount, 0);
    const changeDue = Math.max(0, cashTendered + nonCashPaid - grandTotal);

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          companyId,
          storeId: dto.storeId,
          terminalId: dto.terminalId,
          warehouseId: dto.warehouseId,
          customerId: dto.customerId,
          number: this.orderNumber(),
          status: OrderStatus.COMPLETED,
          subtotal,
          discountTotal,
          taxTotal,
          serviceCharge: dto.serviceCharge ?? 0,
          tip: dto.tip ?? 0,
          grandTotal,
          paidTotal,
          changeDue,
          note: dto.note,
          cashierId: userId,
          completedAt: new Date(),
          items: {
            create: lines.map((l) => ({
              productId: l.product.id,
              variantId: l.variantId,
              nameSnapshot: l.product.name,
              unitPrice: l.unitPrice,
              quantity: l.quantity,
              discount: l.discount,
              taxRateBps: l.taxRateBps,
              taxAmount: l.taxAmount,
              lineTotal: l.lineTotal,
            })),
          },
          payments: {
            create: dto.payments.map((p) => ({
              companyId,
              method: p.method,
              amount: p.amount,
              tendered: p.tendered,
              reference: p.reference,
            })),
          },
        },
        include: { items: true, payments: true, customer: true },
      });

      for (const l of lines) {
        if (!l.product.trackStock) continue;
        await this.inventory.applyMovement(tx, {
          companyId,
          warehouseId: dto.warehouseId,
          productId: l.product.id,
          variantId: l.variantId,
          kind: StockTxnKind.SALE,
          quantity: -l.quantity,
          reference: order.number,
          userId,
        });
      }

      await tx.auditLog.create({
        data: {
          companyId,
          userId,
          action: 'sale.checkout',
          entity: 'Order',
          entityId: order.id,
          metadata: { grandTotal, items: lines.length },
        },
      });

      return order;
    });
  }

  async findAll(companyId: string, query: PaginationDto) {
    const where: Prisma.OrderWhereInput = { companyId, deletedAt: null };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: { customer: true, _count: { select: { items: true } } },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(companyId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { items: true, payments: true, customer: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async refund(companyId: string, userId: string, id: string) {
    const order = await this.findOne(companyId, id);
    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException('Only completed orders can be refunded');
    }
    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (order.warehouseId && product?.trackStock) {
          await this.inventory.applyMovement(tx, {
            companyId,
            warehouseId: order.warehouseId,
            productId: item.productId,
            variantId: item.variantId,
            kind: StockTxnKind.RETURN,
            quantity: item.quantity,
            reference: `refund:${order.number}`,
            userId,
          });
        }
      }
      const updated = await tx.order.update({
        where: { id },
        data: { status: OrderStatus.REFUNDED },
        include: { items: true, payments: true },
      });
      await tx.auditLog.create({
        data: { companyId, userId, action: 'sale.refund', entity: 'Order', entityId: id },
      });
      return updated;
    });
  }

  private orderNumber(): string {
    return `R-${Date.now().toString(36).toUpperCase()}-${randomBytes(2)
      .toString('hex')
      .toUpperCase()}`;
  }
}
