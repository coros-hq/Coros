import { ContractType } from '@org/shared-types';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Document } from '../../document/entities/document.entity';
import { Employee } from '../../employee/entities/employee.entity';

@Entity('contracts')
@Index('idx_contract_organization_id', ['organizationId'])
@Index('idx_contract_employee_id', ['employeeId'])
export class Contract extends BaseEntity {
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @ManyToOne(() => Employee, (employee) => employee.contracts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;

  @Column({ type: 'enum', enum: ContractType })
  type!: ContractType;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date | null;

  @Column({ type: 'float', nullable: true })
  salary?: number | null;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ name: 'document_id', type: 'uuid', nullable: true })
  documentId?: string | null;

  @ManyToOne(() => Document, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'document_id' })
  document?: Document | null;
}
