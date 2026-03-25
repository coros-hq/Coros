import {
  eachMonthOfInterval,
  endOfMonth,
  format,
  isBefore,
  isThisMonth,
  isThisWeek,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from 'date-fns';

import type { ApiEmployee } from '~/services/employee.service';
import type { ApiLeaveRequest } from '~/services/leave-request.service';
import type { ApiProject } from '~/services/project.service';
import type { ApiTask, TaskStatus } from '~/services/task.service';

export const LEAVE_TYPE_COLORS: Record<string, string> = {
  annual: '#10b981',
  sick: '#f59e0b',
  unpaid: '#6b7280',
  maternity: '#8b5cf6',
  paternity: '#3b82f6',
};

/** Default slice colors for employment-type pie (in order of typical segments). */
export const EMPLOYMENT_TYPE_PIE_COLORS = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#8b5cf6',
] as const;

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  todo: '#6b7280',
  in_progress: '#3b82f6',
  in_review: '#f59e0b',
  done: '#10b981',
};

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  planning: '#6b7280',
  active: '#3b82f6',
  on_hold: '#f59e0b',
  completed: '#10b981',
  cancelled: '#ef4444',
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Todo',
  in_progress: 'In progress',
  in_review: 'In review',
  done: 'Done',
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contractor',
  contractor: 'Contractor',
  intern: 'Intern',
};

function last12MonthStarts(reference = new Date()): Date[] {
  const end = startOfMonth(reference);
  const start = startOfMonth(subMonths(reference, 11));
  return eachMonthOfInterval({ start, end });
}

export function getHeadcountByMonth(
  employees: ApiEmployee[],
): { month: string; count: number }[] {
  const months = last12MonthStarts();
  return months.map((monthStart) => {
    const monthEnd = endOfMonth(monthStart);
    const count = employees.filter((e) => {
      if (!e.hireDate) return false;
      const h = parseISO(e.hireDate);
      return h >= monthStart && h <= monthEnd;
    }).length;
    return {
      month: format(monthStart, 'MMM yyyy'),
      count,
    };
  });
}

export function getEmploymentTypeBreakdown(
  employees: ApiEmployee[],
): { name: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const e of employees) {
    const raw = (e.employmentType ?? 'unknown').toLowerCase();
    const key = raw === 'contract' ? 'contract' : raw;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const entries = [...counts.entries()]
    .map(([k, value]) => ({
      name: EMPLOYMENT_LABELS[k] ?? capitalizeLabel(k),
      value,
    }))
    .sort((a, b) => b.value - a.value);
  return entries;
}

export function getDepartmentDistribution(
  employees: ApiEmployee[],
): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const e of employees) {
    const name = e.department?.name?.trim() || 'No department';
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getLeaveByMonth(
  requests: ApiLeaveRequest[],
): { month: string; count: number }[] {
  const months = last12MonthStarts();
  return months.map((monthStart) => {
    const monthEnd = endOfMonth(monthStart);
    const count = requests.filter((r) => {
      const s = parseISO(r.startDate);
      return s >= monthStart && s <= monthEnd;
    }).length;
    return {
      month: format(monthStart, 'MMM yyyy'),
      count,
    };
  });
}

function capitalizeLabel(s: string): string {
  return s
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function getLeaveTypeBreakdown(
  requests: ApiLeaveRequest[],
): { name: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const r of requests) {
    const key = (r.type ?? 'other').toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([k, value]) => ({
      name: capitalizeLabel(k),
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

/** Same segments as pie chart; includes `color` from `LEAVE_TYPE_COLORS`. */
export function getLeaveTypeBreakdownColored(requests: ApiLeaveRequest[]): {
  name: string;
  value: number;
  color: string;
}[] {
  const counts = new Map<string, number>();
  for (const r of requests) {
    const key = (r.type ?? 'other').toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([k, value]) => ({
      name: capitalizeLabel(k),
      value,
      color: LEAVE_TYPE_COLORS[k] ?? 'hsl(var(--muted-foreground))',
    }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function getLeaveStatusBreakdown(requests: ApiLeaveRequest[]): {
  approved: number;
  rejected: number;
  pending: number;
} {
  let approved = 0;
  let rejected = 0;
  let pending = 0;
  for (const r of requests) {
    const s = (r.status ?? '').toLowerCase();
    if (s === 'approved') approved += 1;
    else if (s === 'rejected') rejected += 1;
    else if (s === 'pending') pending += 1;
  }
  return { approved, rejected, pending };
}

export function getApprovalRate(requests: ApiLeaveRequest[]): number {
  const { approved, rejected } = getLeaveStatusBreakdown(requests);
  const resolved = approved + rejected;
  if (resolved === 0) return 0;
  return Math.round((approved / resolved) * 1000) / 10;
}

export function getProjectStatusBreakdown(
  projects: ApiProject[],
): { name: string; value: number }[] {
  const keys = [
    'planning',
    'active',
    'on_hold',
    'completed',
    'cancelled',
  ] as const;
  const counts = new Map<string, number>();
  for (const p of projects) {
    counts.set(p.status, (counts.get(p.status) ?? 0) + 1);
  }
  return keys.map((k) => ({
    name: PROJECT_STATUS_LABELS[k] ?? k,
    value: counts.get(k) ?? 0,
  }));
}

/** Colors aligned with `getProjectStatusBreakdown` row order. */
export const PROJECT_STATUS_PIE_COLORS = [
  PROJECT_STATUS_COLORS.planning,
  PROJECT_STATUS_COLORS.active,
  PROJECT_STATUS_COLORS.on_hold,
  PROJECT_STATUS_COLORS.completed,
  PROJECT_STATUS_COLORS.cancelled,
];

export function getTaskStatusBreakdown(
  tasks: ApiTask[],
): { name: string; value: number; color: string }[] {
  const keys: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'done'];
  const counts = new Map<TaskStatus, number>();
  for (const t of tasks) {
    counts.set(t.status, (counts.get(t.status) ?? 0) + 1);
  }
  return keys.map((k) => ({
    name: TASK_STATUS_LABELS[k],
    value: counts.get(k) ?? 0,
    color: TASK_STATUS_COLORS[k],
  }));
}

export function getTaskCompletionRate(tasks: ApiTask[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === 'done').length;
  return Math.round((done / tasks.length) * 1000) / 10;
}

export function getOverdueTasks(tasks: ApiTask[]): ApiTask[] {
  const today = startOfDay(new Date());
  return tasks.filter((t) => {
    if (t.status === 'done' || !t.dueDate) return false;
    const due = startOfDay(parseISO(t.dueDate));
    return isBefore(due, today);
  });
}

/** Leave requests whose startDate falls in the current calendar month. */
export function countLeaveRequestsThisMonth(
  requests: ApiLeaveRequest[],
): number {
  return requests.filter((r) => isThisMonth(parseISO(r.startDate))).length;
}

/** Done tasks with updatedAt (or createdAt) in the current ISO week. */
export function countTasksCompletedThisWeek(tasks: ApiTask[]): number {
  return tasks.filter((t) => {
    if (t.status !== 'done') return false;
    const raw = t.updatedAt ?? t.createdAt;
    if (!raw) return false;
    return isThisWeek(parseISO(raw), { weekStartsOn: 1 });
  }).length;
}

export function countActiveProjects(projects: ApiProject[]): number {
  return projects.filter((p) => p.status === 'active').length;
}
