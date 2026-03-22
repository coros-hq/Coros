import { ProjectStatus } from '@org/shared-types';
import { BaseEntity } from '../../common/base.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import type { Task } from '../../task/entities/task.entity';
import { ProjectKanbanColumn } from './project-kanban-column.entity';
import { ProjectMember } from './project-member.entity';

@Entity('projects')
@Index('idx_project_organization_id', ['organizationId'])
export class Project extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PLANNING,
  })
  status!: ProjectStatus;

  @Column({ type: 'date', nullable: true })
  startDate!: Date | null;

  @Column({ type: 'date', nullable: true })
  endDate!: Date | null;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @OneToMany(() => ProjectMember, (member) => member.project)
  members!: ProjectMember[];

  @OneToMany(() => ProjectKanbanColumn, (c) => c.project)
  kanbanColumns!: ProjectKanbanColumn[];

  @OneToMany('Task', 'project')
  tasks!: Task[];
}
