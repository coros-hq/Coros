import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';
import { Contract } from './entities/contract.entity';
import { Employee } from '../employee/entities/employee.entity';
import { Document } from '../document/entities/document.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contract, Employee, Document]),
  ],
  controllers: [ContractController],
  providers: [ContractService],
  exports: [ContractService],
})
export class ContractModule {}
