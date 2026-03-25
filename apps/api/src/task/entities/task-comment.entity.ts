import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Task } from './task.entity';
import { User } from '../../user/entities/user.entity';

@Entity('task_comments')
@Index('idx_task_comment_task_id', ['taskId'])
@Index('idx_task_comment_project_id', ['projectId'])
export class TaskComment extends BaseEntity {
  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'task_id', type: 'uuid' })
  taskId!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task!: Task;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author!: User;
}
