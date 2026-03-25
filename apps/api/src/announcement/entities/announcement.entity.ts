import { AnnouncementPriority } from '@org/shared-types';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Department } from '../../department/entities/department.entity';
import { User } from '../../user/entities/user.entity';
import { AnnouncementRead } from './announcement-read.entity';

@Entity('announcements')
@Index('idx_announcement_organization_id', ['organizationId'])
export class Announcement extends BaseEntity {
  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'enum', enum: AnnouncementPriority, default: AnnouncementPriority.NORMAL })
  priority!: AnnouncementPriority;

  /** Public image URLs (e.g. from document uploads). */
  @Column({ name: 'image_urls', type: 'jsonb', default: () => "'[]'" })
  imageUrls!: string[];

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'expires_at', type: 'date', nullable: true })
  expiresAt!: Date | null;

  @ManyToMany(() => User, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'announcement_target_users',
    joinColumn: { name: 'announcement_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  targetUsers!: User[];

  @ManyToMany(() => Department, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'announcement_target_departments',
    joinColumn: { name: 'announcement_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'department_id', referencedColumnName: 'id' },
  })
  targetDepartments!: Department[];

  @OneToMany(() => AnnouncementRead, (r) => r.announcement)
  reads!: AnnouncementRead[];

  /** Populated by batch count in admin queries only. */
  readCount?: number;
}
