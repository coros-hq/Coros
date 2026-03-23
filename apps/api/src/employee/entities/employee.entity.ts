import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne } from "typeorm";
import { BaseEntity } from "../../common/base.entity";
import { Position } from "../../position/entities/position.entity";
import { Department } from "../../department/entities/department.entity";
import { EmploymentType, Status } from "@org/shared-types";
import { User } from "../../user/entities/user.entity";
import { Contract } from "../../contract/entities/contract.entity";
import { LeaveBalance } from "../../leave-balance/entities/leave-balance.entity";
import { LeaveRequest } from "../../leave-request/entities/leave-request.entity";

@Entity('employees')
@Index('idx_employee_user_id', ['userId'])
@Index('idx_employee_organization_id', ['organizationId'])
@Index('idx_employee_manager_id', ['managerId'])
@Index('idx_employee_position_id', ['positionId'])
@Index('idx_employee_department_id', ['departmentId'])
@Index('idx_employee_employment_type', ['employmentType'])
@Index('idx_employee_contract_id', ['contractId'])
@Index('idx_employee_status', ['status'])
export class Employee extends BaseEntity {
  @Column({ length: 255 })
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ length: 255 })
  phone!: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ type: 'date', nullable: true })
  hireDate?: Date;

  @Column({ type: 'enum', enum: Status, default: Status.ACTIVE })
  status?: Status;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'manager_id', type: 'uuid', nullable: true })
  managerId?: string;

  @ManyToOne(() => Employee, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'manager_id' })
  manager?: Employee;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @OneToOne(() => User, (user) => user.employee)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'position_id', type: 'uuid' })
  positionId!: string;

  @ManyToOne(() => Position, (position) => position.employees)
  @JoinColumn({ name: 'position_id' })
  position!: Position;

  @Column({ name: 'department_id', type: 'uuid' })
  departmentId!: string;

  @ManyToOne(() => Department, (department) => department.employees)
  @JoinColumn({ name: 'department_id' })
  department!: Department;

  @Column({
    name: 'employment_type',
    type: 'enum',
    enum: EmploymentType,
    default: EmploymentType.FULL_TIME,
  })
  employmentType!: EmploymentType;

  @Column({ nullable: true })
  address?: string;

  @Column({ name: 'emergency_contact_name', nullable: true })
  emergencyContactName?: string;

  @Column({ name: 'emergency_contact_phone', nullable: true })
  emergencyContactPhone?: string;

  @Column({ name: 'contract_id', type: 'uuid', nullable: true })
  contractId?: string;

  @OneToOne(() => Contract, (contract) => contract.employee)
  @JoinColumn({ name: 'contract_id' })
  contract!: Contract;

  @OneToMany(() => LeaveBalance, (leaveBalance) => leaveBalance.employee)
  leaveBalances?: LeaveBalance[];

  @OneToMany(() => LeaveRequest, (lr) => lr.employee)
  leaveRequests?: LeaveRequest[];
}
