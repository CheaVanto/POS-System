import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/roles.decorator';
import {
  CreateBranchDto,
  CreateStoreDto,
  CreateTerminalDto,
  CreateWarehouseDto,
  UpdateBranchDto,
} from './dto/structure.dto';
import { StructureService } from './structure.service';

@ApiTags('branches')
@ApiBearerAuth()
@Controller()
export class StructureController {
  constructor(private readonly structure: StructureService) {}

  @Get('branches')
  @Permissions('company:manage')
  listBranches(@CurrentUser('companyId') companyId: string) {
    return this.structure.listBranches(companyId);
  }

  @Post('branches')
  @Permissions('company:manage')
  createBranch(@CurrentUser('companyId') companyId: string, @Body() dto: CreateBranchDto) {
    return this.structure.createBranch(companyId, dto);
  }

  @Patch('branches/:id')
  @Permissions('company:manage')
  updateBranch(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.structure.updateBranch(companyId, id, dto);
  }

  @Post('branches/:id/warehouses')
  @Permissions('company:manage')
  createWarehouse(
    @CurrentUser('companyId') companyId: string,
    @Param('id') branchId: string,
    @Body() dto: CreateWarehouseDto,
  ) {
    return this.structure.createWarehouse(companyId, branchId, dto);
  }

  @Post('branches/:id/stores')
  @Permissions('company:manage')
  createStore(
    @CurrentUser('companyId') companyId: string,
    @Param('id') branchId: string,
    @Body() dto: CreateStoreDto,
  ) {
    return this.structure.createStore(companyId, branchId, dto);
  }

  @Post('stores/:id/terminals')
  @Permissions('company:manage')
  createTerminal(
    @CurrentUser('companyId') companyId: string,
    @Param('id') storeId: string,
    @Body() dto: CreateTerminalDto,
  ) {
    return this.structure.createTerminal(companyId, storeId, dto);
  }
}
