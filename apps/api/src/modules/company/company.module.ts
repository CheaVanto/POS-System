import { Module } from '@nestjs/common';
import { CompanyController, CompanyService } from './company.controller';

@Module({
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}
