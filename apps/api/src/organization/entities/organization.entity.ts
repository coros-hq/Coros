import { OrganizationSize } from '@org/shared-types';
import { Column, Entity, OneToMany } from "typeorm";
import { BaseEntity } from '../../common/base.entity';
import { User } from '../../user/entities/user.entity';

@Entity("organization")
export class Organization extends BaseEntity {
    @Column({ type: "varchar", length: 255 })
    name!: string;

    @Column({ type: "varchar", length: 255 })
    slug!: string;

    @Column({ type: "varchar", length: 255 })
    logo!: string;

    @Column({ type: "text" })
    website!: string;

    @Column({ type: "enum", enum: OrganizationSize })
    size!: OrganizationSize

    @Column({ type: "boolean" })
    isActive!: boolean;

    @OneToMany(() => User, (user) => user.organization)
    users!: User[];
}