import { EmploymentType } from "@org/shared-types";
import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { BaseEntity } from "../../common/base.entity";
import { Employee } from "../../employee/entities/employee.entity";

@Entity("contracts")
export class Contract extends BaseEntity {
  @Column()
  startDate!: Date;

  @Column()
  endDate!: Date;

  @Column({ type: "enum", enum: EmploymentType })
  contractType!: EmploymentType;

  @Column()
  contractFile!: string;

  @Column()
  salary!: number;

  @Column()
  currency!: string;

  @OneToOne(() => Employee, (employee) => employee.contract)
  @JoinColumn({ name: "employee_id" })
  employee!: Employee;
}
