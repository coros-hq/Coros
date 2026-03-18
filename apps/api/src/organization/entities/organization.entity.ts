import { OrganizationSize } from '@org/shared-types';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { User } from '../../user/entities/user.entity';
import { Industry } from '../../industry/entities/industry.entity';
import { Department } from '../../department/entities/department.entity';

@Entity('organization')
export class Organization extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'uuid', nullable: true })
  industryId!: string | null;

  @ManyToOne(() => Industry, (industry) => industry.organizations, {
    nullable: true,
  })
  @JoinColumn({ name: 'industryId' })
  industry!: Industry | null;

  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'varchar', length: 255 })
  logo!: string;

  @Column({ type: 'text' })
  website!: string;

  @Column({ type: 'enum', enum: OrganizationSize })
  size!: OrganizationSize;

  @Column({ type: 'boolean' })
  isActive!: boolean;

  @OneToMany(() => User, (user) => user.organization)
  users!: User[];

  @OneToMany(() => Department, (department) => department.organization)
  departments!: Department[];
}