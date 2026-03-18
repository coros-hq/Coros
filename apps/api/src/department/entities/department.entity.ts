import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "../../common/base.entity";
import { Organization } from "../../organization/entities/organization.entity";
import { Position } from "../../position/entities/position.entity";
import { Employee } from "../../employee/entities/employee.entity";

@Entity("departments")
export class Department extends BaseEntity {
    @Column()
    name!: string;

    @Column()
    color?: string

    @ManyToOne(() => Organization, (organization) => organization.departments)
    @JoinColumn({ name: "organization_id" })
    organization!: Organization;
    
    @OneToMany(() => Position, (position) => position.department)
    positions!: Position[]; 

    @OneToMany(() => Employee, (employee) => employee.department)
    employees!: Employee[];
}
