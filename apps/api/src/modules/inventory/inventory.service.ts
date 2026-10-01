import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, StockTxnKind } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, PaginationDto } from '../../common/dto/pagination.dto';
import { AdjustStockDto, InventoryHistoryQueryDto } from './dto/inventory.dto';

export interface StockMovement {
  companyId: string;
  warehouseId: string;
  productId: string;
  variantId?: string | null;
  kind: StockTxnKind;
  quantity: number;
  unitCost?: number;
  reference?: string;
  userId?: string;
  allowNegative?: boolean;
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async applyMovement(tx: Prisma.TransactionClient, m: StockMovement) {
    const existing = await tx.inventoryItem.findFirst({
      where: {
        warehouseId: m.warehouseId,
        productId: m.productId,
        variantId: m.variantId ?? null,
      },
    });

    const currentQty = existing?.quantity ?? 0;
    const newQty = currentQty + m.quantity;
    if (newQty < 0 && !m.allowNegative) {
      throw new BadRequestException(
        `Insufficient stock (have ${currentQty}, need ${-m.quantity})`,
      );
    }

    let avgCost = existing?.avgCost ?? 0;
    if (m.quantity > 0 && m.unitCost && m.unitCost > 0) {
      const totalValue = currentQty * avgCost + m.quantity * m.unitCost;
      avgCost = Math.round(totalValue / (currentQty + m.quantity));
    }

    const item = existing
      ? await tx.inventoryItem.update({
          where: { id: existing.id },
          data: { quantity: newQty, avgCost },
        })
      : await tx.inventoryItem.create({
          data: {
            companyId: m.companyId,
            warehouseId: m.warehouseId,
            productId: m.productId,
            variantId: m.variantId ?? null,
            quantity: newQty,
            avgCost,
          },
        });

    await tx.stockTransaction.create({
      data: {
        companyId: m.companyId,
        warehouseId: m.warehouseId,
        productId: m.productId,
        variantId: m.variantId ?? null,
        kind: m.kind,
        quantity: m.quantity,
        unitCost: m.unitCost ?? 0,
        balanceAfter: newQty,
        reference: m.reference,
        createdById: m.userId,
      },
    });

    return item;
  }

  async adjust(companyId: string, dto: AdjustStockDto, userId?: string) {
    return this.prisma.$transaction((tx) =>
      this.applyMovement(tx, {
        companyId,
        warehouseId: dto.warehouseId,
        productId: dto.productId,
        variantId: dto.variantId,
        kind: StockTxnKind.ADJUSTMENT,
        quantity: dto.quantity,
        unitCost: dto.unitCost,
        reference: dto.reason,
        userId,
      }),
    );
  }

  async levels(companyId: string, query: PaginationDto, branchId?: string) {
    const where: Prisma.InventoryItemWhereInput = {
      companyId,
      ...(branchId ? { warehouse: { branchId } } : {}),
      ...(query.q
        ? { product: { name: { contains: query.q, mode: 'insensitive' } } }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.inventoryItem.findMany({
        where,
        include: { product: true, variant: true, warehouse: true },
        orderBy: { updatedAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  ledger(companyId: string, productId: string) {
    return this.prisma.stockTransaction.findMany({
      where: { companyId, productId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async history(companyId: string, query: InventoryHistoryQueryDto) {
    const from = query.from ? new Date(query.from) : undefined;
    let to: Date | undefined;
    if (query.to) {
      to = new Date(query.to);
      if (/^\d{4}-\d{2}-\d{2}$/.test(query.to)) to = new Date(to.getTime() + 864e5 - 1);
    }

    const where: Prisma.StockTransactionWhereInput = {
      companyId,
      ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.kind ? { kind: query.kind } : {}),
      ...(query.branchId ? { warehouse: { branchId: query.branchId } } : {}),
      ...(from || to
        ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
      ...(query.q ? { product: { name: { contains: query.q, mode: 'insensitive' } } } : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.stockTransaction.findMany({
        where,
        include: {
          product: { select: { name: true, sku: true } },
          warehouse: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.stockTransaction.count({ where }),
    ]);

    const userIds = [...new Set(rows.map((r) => r.createdById).filter((v): v is string => !!v))];
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, fullName: true },
        })
      : [];
    const nameById = new Map(users.map((u) => [u.id, u.fullName]));

    return paginate(
      rows.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        kind: r.kind,
        quantity: r.quantity,
        balanceAfter: r.balanceAfter,
        unitCost: r.unitCost,
        reference: r.reference,
        product: r.product,
        warehouse: r.warehouse,
        by: r.createdById ? nameById.get(r.createdById) ?? 'Unknown' : 'System',
      })),
      total,
      query.page,
      query.limit,
    );
  }
}
