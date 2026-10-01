import { Module } from '@nestjs/common';
import { ReportsController, ReportsService } from './reports.controller';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
