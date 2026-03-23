import { BaseEntity } from '../../common/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Employee } from '../../employee/entities/employee.entity';

@Entity('documents')
@Index('idx_document_organization_id', ['organizationId'])
@Index('idx_document_uploaded_by', ['uploadedById'])
@Index('idx_document_employee_id', ['employeeId'])
export class Document extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 512 })
  key!: string;

  @Column({ type: 'varchar', length: 1024 })
  url!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 128 })
  mimeType!: string;

  @Column({ type: 'int', default: 0 })
  size!: number;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'uploaded_by_id', type: 'uuid' })
  uploadedById!: string;

  @Column({ name: 'employee_id', type: 'uuid', nullable: true })
  employeeId!: string | null;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee | null;
}
