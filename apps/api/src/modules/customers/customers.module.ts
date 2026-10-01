import { Module } from '@nestjs/common';
import { CustomersController, CustomersService } from './customers.controller';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
