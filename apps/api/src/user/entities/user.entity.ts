import { Role } from '@org/shared-types';
import { Column, Entity, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Organization } from '../../organization/entities/organization.entity';
import { RefreshToken } from '../../auth/entities/refreshToken.entity';
import { Employee } from '../../employee/entities/employee.entity';
import { LeaveRequest } from '../../leave-request/entities/leave-request.entity';

@Entity('user')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'enum', enum: Role })
  role!: Role;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'boolean' })
  isActive!: boolean;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization, (organization) => organization.users)
  organization!: Organization;

  @OneToOne(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshToken!: RefreshToken;

  @OneToOne(() => Employee, (employee) => employee.user)
  employee?: Employee;

  @OneToMany(() => LeaveRequest, (lr) => lr.approvedBy)
  approvedLeaveRequests!: LeaveRequest[];
}