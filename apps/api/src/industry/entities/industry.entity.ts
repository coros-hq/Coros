import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Organization } from '../../organization/entities/organization.entity';

@Entity('industry')
export class Industry extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @OneToMany(() => Organization, (organization) => organization.industry)
  organizations!: Organization[];
}
