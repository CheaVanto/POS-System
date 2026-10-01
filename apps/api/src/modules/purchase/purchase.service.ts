import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PurchaseOrderStatus, StockTxnKind } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { Money } from '../../common/money';
import { paginate, PaginationDto } from '../../common/dto/pagination.dto';
import { InventoryService } from '../inventory/inventory.service';
import { CreatePurchaseOrderDto, ReceiveDto } from './dto/purchase.dto';

@Injectable()
export class PurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  async create(companyId: string, userId: string, dto: CreatePurchaseOrderDto) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, companyId, deletedAt: null },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    const productIds = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, companyId, deletedAt: null },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    for (const item of dto.items) {
      if (!byId.has(item.productId)) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }
    }

    let subtotal = 0;
    let taxTotal = 0;
    const items = dto.items.map((i) => {
      const p = byId.get(i.productId)!;
      const net = i.unitCost * i.quantity;
      const taxRateBps = i.taxRateBps ?? 0;
      const taxAmount = Money.tax(net, taxRateBps);
      subtotal += net;
      taxTotal += taxAmount;
      return {
        productId: p.id,
        variantId: i.variantId ?? null,
        nameSnapshot: p.name,
        unitCost: i.unitCost,
        quantity: i.quantity,
        taxRateBps,
        taxAmount,
        lineTotal: net + taxAmount,
      };
    });

    return this.prisma.purchaseOrder.create({
      data: {
        companyId,
        supplierId: dto.supplierId,
        warehouseId: dto.warehouseId,
        number: this.poNumber(),
        status: PurchaseOrderStatus.DRAFT,
        subtotal,
        taxTotal,
        grandTotal: subtotal + taxTotal,
        note: dto.note,
        expectedAt: dto.expectedAt ? new Date(dto.expectedAt) : null,
        createdById: userId,
        items: { create: items },
      },
      include: { items: true, supplier: true },
    });
  }

  async findAll(companyId: string, query: PaginationDto) {
    const where: Prisma.PurchaseOrderWhereInput = { companyId, deletedAt: null };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.purchaseOrder.findMany({
        where,
        include: { supplier: true, _count: { select: { items: true } } },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(companyId: string, id: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { items: true, supplier: true, warehouse: true },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async submit(companyId: string, id: string) {
    const po = await this.findOne(companyId, id);
    if (po.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException('Only draft POs can be ordered');
    }
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.ORDERED, orderedAt: new Date() },
      include: { items: true, supplier: true },
    });
  }

  async cancel(companyId: string, id: string) {
    const po = await this.findOne(companyId, id);
    const receivedStates: PurchaseOrderStatus[] = [
      PurchaseOrderStatus.RECEIVED,
      PurchaseOrderStatus.PARTIAL,
    ];
    if (receivedStates.includes(po.status)) {
      throw new BadRequestException('Cannot cancel a PO with received goods');
    }
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.CANCELLED },
    });
  }

  async receive(companyId: string, userId: string, id: string, dto: ReceiveDto) {
    const po = await this.findOne(companyId, id);
    const receivableStates: PurchaseOrderStatus[] = [
      PurchaseOrderStatus.ORDERED,
      PurchaseOrderStatus.PARTIAL,
    ];
    if (!receivableStates.includes(po.status)) {
      throw new BadRequestException('PO must be ORDERED before receiving');
    }

    const requested = new Map<string, number>();
    if (dto.lines?.length) for (const l of dto.lines) requested.set(l.itemId, l.quantity);

    return this.prisma.$transaction(async (tx) => {
      let receivedValue = 0;

      for (const item of po.items) {
        const outstanding = item.quantity - item.quantityReceived;
        if (outstanding <= 0) continue;
        const want = dto.lines?.length ? requested.get(item.id) ?? 0 : outstanding;
        const recv = Math.min(want, outstanding);
        if (recv <= 0) continue;

        await this.inventory.applyMovement(tx, {
          companyId,
          warehouseId: po.warehouseId,
          productId: item.productId,
          variantId: item.variantId,
          kind: StockTxnKind.PURCHASE,
          quantity: recv,
          unitCost: item.unitCost,
          reference: po.number,
          userId,
        });
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { quantityReceived: { increment: recv } },
        });
        await tx.product.update({
          where: { id: item.productId },
          data: { costPrice: item.unitCost },
        });
        receivedValue += recv * item.unitCost;
      }

      if (receivedValue === 0) throw new BadRequestException('Nothing to receive');

      const lines = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: po.id },
      });
      const fullyReceived = lines.every((l) => l.quantityReceived >= l.quantity);
      const status = fullyReceived
        ? PurchaseOrderStatus.RECEIVED
        : PurchaseOrderStatus.PARTIAL;

      const updated = await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status, receivedAt: fullyReceived ? new Date() : po.receivedAt },
        include: { items: true, supplier: true },
      });
      await tx.supplier.update({
        where: { id: po.supplierId },
        data: { balance: { increment: receivedValue } },
      });
      await tx.auditLog.create({
        data: {
          companyId,
          userId,
          action: 'purchase.receive',
          entity: 'PurchaseOrder',
          entityId: po.id,
          metadata: { receivedValue, status },
        },
      });
      return updated;
    });
  }

  private poNumber(): string {
    return `PO-${Date.now().toString(36).toUpperCase()}-${randomBytes(2)
      .toString('hex')
      .toUpperCase()}`;
  }
}
