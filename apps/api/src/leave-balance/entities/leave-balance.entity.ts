import { Column, Entity, JoinColumn, ManyToOne, RelationId } from "typeorm";
import { BaseEntity } from "../../common/base.entity";
import { Employee } from "../../employee/entities/employee.entity";
import { LeaveType } from "@org/shared-types";

@Entity("leave_balances")
export class LeaveBalance extends BaseEntity {
    @Column({ type: "enum", enum: LeaveType })
    type!: LeaveType;

    @Column()
    year!: string;

    @Column()
    used!: number;

    @Column()
    remaining!: number;

    @Column()
    total!: number;

    @RelationId((leaveBalance: LeaveBalance) => leaveBalance.employee)
    employeeId!: string;

    @ManyToOne(() => Employee, (employee) => employee.leaveBalances)
    @JoinColumn({ name: "employee_id" })
    employee!: Employee;
}
