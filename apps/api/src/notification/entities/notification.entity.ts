import { NotificationType } from '@org/shared-types';
import { BaseEntity } from '../../common/base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('notifications')
@Index('idx_notification_user_id', ['userId'])
@Index('idx_notification_organization_id', ['organizationId'])
@Index('idx_notification_read', ['read'])
export class Notification extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 500 })
  message!: string;

  @Column({ type: 'boolean', default: false })
  read!: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  link!: string | null;
}
