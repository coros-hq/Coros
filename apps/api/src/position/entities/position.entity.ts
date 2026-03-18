import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "../../common/base.entity";
import { Department } from "../../department/entities/department.entity";
import { Employee } from "../../employee/entities/employee.entity";

@Entity("positions")
export class Position extends BaseEntity {
  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToOne(() => Department, (department) => department.positions)
  @JoinColumn({ name: "department_id" })
  department!: Department;

  @OneToMany(() => Employee, (employee) => employee.position)
  employees!: Employee[];
}
