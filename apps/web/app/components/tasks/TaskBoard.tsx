import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
} from '@dnd-kit/core';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { TaskBoardCard } from '~/components/tasks/TaskBoardCard';
import type { ApiTask } from '~/services/task.service';

const COLUMNS: { id: ApiTask['status']; label: string }[] = [
  { id: 'todo', label: 'To do' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'in_review', label: 'In review' },
  { id: 'done', label: 'Done' },
];

function DroppableColumn({
  id,
  label,
  tasks,
  canEdit,
  canDelete,
  canMove,
  onEdit,
  onDelete,
}: {
  id: ApiTask['status'];
  label: string;
  tasks: ApiTask[];
  canEdit: (task: ApiTask) => boolean;
  canDelete: (task: ApiTask) => boolean;
  canMove: (task: ApiTask) => boolean;
  onEdit: (task: ApiTask) => void;
  onDelete: (task: ApiTask) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="flex min-w-[280px] max-w-[280px] flex-shrink-0 flex-col"
    >
      <Card
        className={`flex min-h-[400px] flex-1 flex-col overflow-hidden transition-colors ${
          isOver ? 'border-primary bg-primary/5' : ''
        }`}
      >
        <CardHeader className="shrink-0 border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">{label}</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {tasks.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="min-h-[320px] flex-1 space-y-2 overflow-y-auto p-3">
          {tasks.length === 0 ? (
            <div className="rounded-md border border-dashed py-8 text-center text-xs text-muted-foreground">
              Drop here
            </div>
          ) : (
            tasks.map((task) => (
              <TaskBoardCard
                key={task.id}
                task={task}
                canEdit={canEdit(task)}
                canDelete={canDelete(task)}
                canMove={canMove(task)}
                onEdit={() => onEdit(task)}
                onDelete={() => onDelete(task)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export interface TaskBoardProps {
  tasks: ApiTask[];
  canEdit: (task: ApiTask) => boolean;
  canDelete: (task: ApiTask) => boolean;
  canMove: (task: ApiTask) => boolean;
  onEdit: (task: ApiTask) => void;
  onDelete: (task: ApiTask) => void;
  onStatusChange: (task: ApiTask, newStatus: ApiTask['status']) => void;
}

export function TaskBoard({
  tasks,
  canEdit,
  canDelete,
  canMove,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskBoardProps) {
  const [activeTask, setActiveTask] = useState<ApiTask | null>(null);

  const validStatuses = useMemo(
    () => new Set(COLUMNS.map((c) => c.id)),
    []
  );

  const tasksByStatus = useMemo(() => {
    const map = new Map<ApiTask['status'], ApiTask[]>();
    for (const col of COLUMNS) {
      map.set(col.id, []);
    }
    for (const task of tasks) {
      const status = validStatuses.has(task.status) ? task.status : 'todo';
      const list = map.get(status) ?? [];
      list.push(task);
      map.set(status, list);
    }
    return map;
  }, [tasks, validStatuses]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = active.data.current?.task as ApiTask | undefined;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) return;

    const task = active.data.current?.task as ApiTask | undefined;
    const targetStatus = over.id as ApiTask['status'];

    if (task && validStatuses.has(targetStatus) && task.status !== targetStatus) {
      onStatusChange(task, targetStatus);
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const columnTasks = tasksByStatus.get(col.id) ?? [];
          return (
            <DroppableColumn
              key={col.id}
              id={col.id}
              label={col.label}
              tasks={columnTasks}
              canEdit={canEdit}
              canDelete={canDelete}
              canMove={canMove}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-[260px] opacity-95 shadow-xl">
            <TaskBoardCard
              task={activeTask}
              canEdit={canEdit(activeTask)}
              canDelete={canDelete(activeTask)}
              canMove={false}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
