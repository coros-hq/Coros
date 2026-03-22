import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Bell,
  CalendarOff,
  CheckSquare,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  FolderKanban,
  Search,
  Settings2,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '~/components/ui/sheet';
import { cn } from '~/lib/utils';
import type { ApiEmployee } from '~/services/employee.service';
import { listEmployees } from '~/services/employee.service';
import { getAllLeaveRequests } from '~/services/leave-request.service';
import { getAllProjects } from '~/services/project.service';
import { useAuthStore } from '~/stores/auth.store';

type RowStatus = 'active' | 'on_leave' | 'inactive';

interface EmployeeRow {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  status: RowStatus;
  joinedAt: string;
}

function mapApiStatus(s?: string): RowStatus {
  if (s === 'on_leave') return 'on_leave';
  if (s === 'inactive' || s === 'terminated') return 'inactive';
  return 'active';
}

function formatJoined(d?: string): string {
  if (!d) return '—';
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return d;
  }
}

function mapEmployee(e: ApiEmployee): EmployeeRow {
  return {
    id: e.id,
    name: `${e.firstName} ${e.lastName}`.trim(),
    email: e.user?.email ?? '—',
    department: e.department?.name ?? '—',
    position: e.position?.name ?? '—',
    status: mapApiStatus(e.status),
    joinedAt: formatJoined(e.hireDate),
  };
}

function StatusBadge({ status }: { status: RowStatus }) {
  const cfg = {
    active: {
      className: 'border-success/30 bg-success-muted text-success',
      label: 'Active',
      dot: 'bg-success',
    },
    on_leave: {
      className: 'border-warning/30 bg-warning-muted text-warning',
      label: 'On leave',
      dot: 'bg-warning',
    },
    inactive: {
      className: 'border-border bg-muted text-muted-foreground',
      label: 'Inactive',
      dot: 'bg-muted-foreground',
    },
  }[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        cfg.className,
      )}
    >
      <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="text-xs leading-snug text-muted-foreground">{sub}</p>
        </div>
        <div className="rounded-md bg-muted p-1.5 text-muted-foreground">
          <Icon className="size-4" aria-hidden />
        </div>
      </div>
    </div>
  );
}

function CellSecondary({ children }: { children: string }) {
  const empty = children === '—';
  return (
    <span className={cn('text-sm', empty ? 'text-muted-foreground' : 'text-foreground')}>{children}</span>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [pendingLeave, setPendingLeave] = useState(0);
  const [activeProjects, setActiveProjects] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EmployeeRow | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [emps, requests, projects] = await Promise.all([
          listEmployees(),
          getAllLeaveRequests().catch(() => []),
          getAllProjects().catch(() => []),
        ]);
        if (cancelled) return;
        setRows(emps.map(mapEmployee));
        setPendingLeave(requests.filter((r) => r.status === 'pending').length);
        setActiveProjects(projects.filter((p) => p.status === 'active').length);
        setTotalTasks(projects.reduce((s, p) => s + (p.taskCount ?? 0), 0));
      } catch (e: unknown) {
        if (cancelled) return;
        const msg =
          e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Failed to load';
        setError(msg);
        setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    [],
  );

  const columns = useMemo<ColumnDef<EmployeeRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const initials = row.original.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 ring-2 ring-primary ring-offset-2 ring-offset-background">
                <AvatarFallback className="bg-muted text-[11px] font-semibold text-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{row.original.name}</p>
                <p className="text-xs text-muted-foreground">{row.original.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'department',
        header: 'Department',
        cell: ({ row }) => <CellSecondary>{row.original.department}</CellSecondary>,
      },
      {
        accessorKey: 'position',
        header: 'Position',
        cell: ({ row }) => <CellSecondary>{row.original.position}</CellSecondary>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'joinedAt',
        header: 'Joined',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.joinedAt}</span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _id, filter) => {
      const q = String(filter ?? '').toLowerCase();
      if (!q) return true;
      const v = row.original;
      return [v.name, v.email, v.department, v.position, v.status, v.joinedAt].some((x) =>
        String(x).toLowerCase().includes(q),
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const totalEmployees = rows.length;

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-border bg-background px-5">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Dashboard</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground">Overview</span>
        </nav>
        <div className="flex items-center gap-1">
          <Button
            className="h-7 w-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            size="icon"
            type="button"
            variant="ghost"
          >
            <Bell className="size-4" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Button
            className="h-7 w-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            size="icon"
            type="button"
            variant="ghost"
          >
            <Settings2 className="size-4" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </div>

      <div className="space-y-8 p-6">
        <header className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{todayLabel}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Good morning, {user?.firstName ?? 'there'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening at {user?.organizationName ?? 'your organization'} today.
          </p>
        </header>

        {error ? (
          <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Users} label="Total Employees" sub="Team total" value={loading ? '—' : totalEmployees} />
          <StatCard icon={FolderKanban} label="Active Projects" sub="In progress" value={loading ? '—' : activeProjects} />
          <StatCard icon={CheckSquare} label="Total Tasks" sub="Across projects" value={loading ? '—' : totalTasks} />
          <StatCard
            icon={CalendarOff}
            label="Leave Requests"
            sub="Pending approval"
            value={loading ? '—' : pendingLeave}
          />
        </div>

        <section className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="text-sm font-semibold text-foreground">Recent employees</h2>
              <span className="text-xs text-muted-foreground">
                {table.getFilteredRowModel().rows.length} result
                {table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-7 w-52 rounded-md border border-border bg-background pl-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-border focus:outline-none"
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Search…"
                  type="search"
                  value={globalFilter}
                />
              </div>
              <Button
                className="h-7 border border-border bg-background text-xs text-foreground hover:border-border"
                type="button"
                variant="outline"
              >
                Filter
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-border">
                    {hg.headers.map((header) => {
                      const sorted = header.column.getIsSorted();
                      return (
                        <th
                          className="h-10 px-5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground"
                          key={header.id}
                        >
                          {header.column.getCanSort() ? (
                            <button
                              className="inline-flex items-center gap-1 text-left hover:text-foreground"
                              onClick={header.column.getToggleSortingHandler()}
                              type="button"
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {sorted === 'asc' ? (
                                <ChevronUp className="size-3.5 text-primary" />
                              ) : sorted === 'desc' ? (
                                <ChevronDown className="size-3.5 text-primary" />
                              ) : (
                                <ChevronsUpDown className="size-3.5 text-muted-foreground" />
                              )}
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-5 py-12 text-center text-sm text-muted-foreground" colSpan={columns.length}>
                      Loading…
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td className="px-5 py-12 text-center text-sm text-muted-foreground" colSpan={columns.length}>
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      className="cursor-pointer border-b border-border transition-colors duration-100 hover:bg-accent/10"
                      key={row.id}
                      onClick={() => setSelected(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td className="px-5 py-3 align-middle" key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {table.getFilteredRowModel().rows.length} result
              {table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Button
                className="h-7 border border-border bg-background text-foreground hover:bg-accent"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
                size="sm"
                type="button"
                variant="outline"
              >
                Prev
              </Button>
              <span>
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
              </span>
              <Button
                className="h-7 border border-border bg-background text-foreground hover:bg-accent"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
                size="sm"
                type="button"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        </section>
      </div>

      <EmployeeSheet employee={selected} onClose={() => setSelected(null)} open={!!selected} />
    </div>
  );
}

function EmployeeSheet({
  employee,
  open,
  onClose,
}: {
  employee: EmployeeRow | null;
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  if (!employee) return null;
  const initials = employee.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <Sheet
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      open={open}
    >
      <SheetContent className="w-[420px] border-l border-border bg-background p-0 text-foreground">
        <div className="flex items-start gap-4 p-6">
          <Avatar className="h-12 w-12 ring-2 ring-primary ring-offset-2 ring-offset-background">
            <AvatarFallback className="bg-muted text-sm font-semibold text-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-lg font-semibold text-foreground">{employee.name}</SheetTitle>
            <SheetDescription className="mt-1 text-sm text-muted-foreground">
              {employee.position} · {employee.department}
            </SheetDescription>
            <div className="mt-2">
              <StatusBadge status={employee.status} />
            </div>
          </div>
        </div>
        <Separator className="bg-muted" />
        <div className="space-y-4 p-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Details</p>
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium text-foreground">{employee.email}</span>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Department</span>
            <span className="font-medium text-foreground">{employee.department}</span>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Position</span>
            <span className="font-medium text-foreground">{employee.position}</span>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Joined</span>
            <span className="font-mono text-foreground">{employee.joinedAt}</span>
          </div>
        </div>
        <Separator className="bg-muted" />
        <div className="flex gap-2 p-6">
          <Button
            className="flex-1 h-10 border-border bg-background text-foreground hover:bg-muted"
            onClick={onClose}
            variant="outline"
          >
            Close
          </Button>
          <Button
            className="flex-1 h-10 bg-primary text-white hover:bg-primary/90"
            onClick={() => {
              navigate(`/employees/${employee.id}`);
              onClose();
            }}
            type="button"
          >
            View full profile
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
