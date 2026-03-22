import { TaskPriority, TaskStatus } from '@org/shared-types';
import { BaseEntity } from '../../common/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Employee } from '../../employee/entities/employee.entity';
import { ProjectKanbanColumn } from '../../project/entities/project-kanban-column.entity';
import { Project } from '../../project/entities/project.entity';

@Entity('tasks')
@Index('idx_task_project_id', ['projectId'])
@Index('idx_task_organization_id', ['organizationId'])
export class Task extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status!: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority!: TaskPriority;

  @Column({ type: 'date', nullable: true })
  dueDate!: Date | null;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @ManyToOne(() => Project, (project) => project.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({ name: 'kanban_column_id', type: 'uuid', nullable: true })
  kanbanColumnId!: string | null;

  @ManyToOne(() => ProjectKanbanColumn, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'kanban_column_id' })
  kanbanColumn!: ProjectKanbanColumn | null;

  @Column({ name: 'assignee_id', type: 'uuid', nullable: true })
  assigneeId!: string | null;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee!: Employee | null;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;
}
