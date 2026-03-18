import { LeaveType, LeaveRequestStatus } from "@org/shared-types";
import { BaseEntity } from "../../common/base.entity";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Employee } from "../../employee/entities/employee.entity";
import { User } from "../../user/entities/user.entity";

@Entity("leave_requests")
@Index("idx_leave_request_employee_id", ["employeeId"])
@Index("idx_leave_request_status", ["status"])
@Index("idx_leave_request_dates", ["startDate", "endDate"])
export class LeaveRequest extends BaseEntity {
  @Column({ type: "enum", enum: LeaveType })
  type!: LeaveType;

  @Column({ type: "date" })
  startDate!: Date;

  @Column({ type: "date" })
  endDate!: Date;

  @Column({ type: "enum", enum: LeaveRequestStatus, default: LeaveRequestStatus.PENDING })
  status!: LeaveRequestStatus;

  @Column({ type: "varchar", length: 255, nullable: true })
  reason!: string | null;

  @Column({ name: "employee_id", type: "uuid" })
  employeeId!: string;

  @ManyToOne(() => Employee, (employee) => employee.leaveRequests)
  @JoinColumn({ name: "employee_id" })
  employee!: Employee;

  @Column({ name: "approved_by_id", type: "uuid", nullable: true })
  approvedById!: string | null;

  @ManyToOne(() => User, (user) => user.approvedLeaveRequests, { nullable: true })
  @JoinColumn({ name: "approved_by_id" })
  approvedBy!: User | null;
}
