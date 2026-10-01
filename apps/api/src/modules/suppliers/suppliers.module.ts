import { Module } from '@nestjs/common';
import { SuppliersController, SuppliersService } from './suppliers.controller';

@Module({
  controllers: [SuppliersController],
  providers: [SuppliersService],
})
export class SuppliersModule {}
