import { BaseEntity } from '../../common/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Project } from './project.entity';

@Entity('project_kanban_columns')
@Index('idx_pkc_project_position', ['projectId', 'position'])
export class ProjectKanbanColumn extends BaseEntity {
  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @ManyToOne(() => Project, (p) => p.kanbanColumns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'int' })
  position!: number;

  /** When set, maps to legacy TaskStatus for reporting and sync */
  @Column({ name: 'status_key', type: 'varchar', length: 32, nullable: true })
  statusKey!: string | null;
}
