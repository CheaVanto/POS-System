import { Controller, Get, Injectable } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async context(companyId: string) {
    const [company, warehouses, stores, terminals, branches] =
      await this.prisma.$transaction([
        this.prisma.company.findUniqueOrThrow({
          where: { id: companyId },
          select: { id: true, name: true, currency: true, taxRateBps: true, logoUrl: true },
        }),
        this.prisma.warehouse.findMany({
          where: { companyId, deletedAt: null, isActive: true },
          select: { id: true, name: true, code: true, branchId: true },
        }),
        this.prisma.store.findMany({
          where: { companyId, deletedAt: null, isActive: true },
          select: { id: true, name: true, defaultWarehouseId: true, branchId: true },
        }),
        this.prisma.terminal.findMany({
          where: { companyId, deletedAt: null, isActive: true },
          select: { id: true, name: true, storeId: true },
        }),
        this.prisma.branch.findMany({
          where: { companyId, deletedAt: null, isActive: true },
          orderBy: { createdAt: 'asc' },
          select: { id: true, name: true, code: true },
        }),
      ]);

    const tree = branches.map((b) => ({
      ...b,
      warehouses: warehouses.filter((w) => w.branchId === b.id),
      stores: stores
        .filter((s) => s.branchId === b.id)
        .map((s) => ({ ...s, terminals: terminals.filter((t) => t.storeId === s.id) })),
    }));

    return { company, branches, warehouses, stores, terminals, tree };
  }
}

@ApiTags('company')
@ApiBearerAuth()
@Controller('company')
export class CompanyController {
  constructor(private readonly company: CompanyService) {}

  @Get('context')
  @ApiOperation({ summary: 'Company + stores/terminals/warehouses for the shell' })
  context(@CurrentUser('companyId') companyId: string) {
    return this.company.context(companyId);
  }
}
