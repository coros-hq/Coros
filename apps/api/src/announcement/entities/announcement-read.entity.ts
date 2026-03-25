import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Announcement } from './announcement.entity';

@Entity('announcement_reads')
@Unique(['announcementId', 'userId'])
@Index('idx_announcement_read_user_id', ['userId'])
export class AnnouncementRead {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'announcement_id', type: 'uuid' })
  announcementId!: string;

  @ManyToOne(() => Announcement, (a) => a.reads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'announcement_id' })
  announcement!: Announcement;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'read_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  readAt!: Date;
}
