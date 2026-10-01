import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateBranchDto,
  CreateStoreDto,
  CreateTerminalDto,
  CreateWarehouseDto,
  UpdateBranchDto,
} from './dto/structure.dto';

@Injectable()
export class StructureService {
  constructor(private readonly prisma: PrismaService) {}

  listBranches(companyId: string) {
    return this.prisma.branch.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: {
        warehouses: {
          where: { deletedAt: null },
          select: { id: true, name: true, code: true, isActive: true },
        },
        stores: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            defaultWarehouseId: true,
            isActive: true,
            terminals: {
              where: { deletedAt: null },
              select: { id: true, name: true, code: true, isActive: true },
            },
          },
        },
      },
    });
  }

  async createBranch(companyId: string, dto: CreateBranchDto) {
    try {
      return await this.prisma.branch.create({ data: { ...dto, companyId } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException(`Branch code "${dto.code}" already exists`);
      }
      throw e;
    }
  }

  async updateBranch(companyId: string, id: string, dto: UpdateBranchDto) {
    await this.getBranch(companyId, id);
    return this.prisma.branch.update({ where: { id }, data: dto });
  }

  async createWarehouse(companyId: string, branchId: string, dto: CreateWarehouseDto) {
    await this.getBranch(companyId, branchId);
    return this.prisma.warehouse.create({ data: { ...dto, companyId, branchId } });
  }

  async createStore(companyId: string, branchId: string, dto: CreateStoreDto) {
    await this.getBranch(companyId, branchId);
    if (dto.defaultWarehouseId) await this.assertWarehouse(companyId, dto.defaultWarehouseId);
    return this.prisma.store.create({
      data: { companyId, branchId, name: dto.name, defaultWarehouseId: dto.defaultWarehouseId },
    });
  }

  async createTerminal(companyId: string, storeId: string, dto: CreateTerminalDto) {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, companyId, deletedAt: null },
    });
    if (!store) throw new NotFoundException('Store not found');
    return this.prisma.terminal.create({ data: { ...dto, companyId, storeId } });
  }

  private async getBranch(companyId: string, id: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  private async assertWarehouse(companyId: string, id: string) {
    const wh = await this.prisma.warehouse.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!wh) throw new NotFoundException('Warehouse not found');
    return wh;
  }
}
