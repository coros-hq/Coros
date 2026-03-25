import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { User } from '../../user/entities/user.entity';

const DEFAULT_EXPIRY_HOURS = 168; // 7 days

@Entity('employee_invite_token')
export class EmployeeInviteToken extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @Column({ type: 'varchar', length: 64, unique: true })
  token!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type: 'boolean', default: false })
  used!: boolean;

  static expiresInHours(hours = DEFAULT_EXPIRY_HOURS): Date {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    return d;
  }
}
