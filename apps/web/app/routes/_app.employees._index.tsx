import { useEffect, useMemo, useRef, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import {
  LayoutGrid,
  LayoutList,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  UserX,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { DataTable } from '~/components/data-table/DataTable';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '~/lib/utils';
import { convertToCSV, downloadCSV } from '~/lib/csv';
import { ExportButton } from '~/components/common/ExportButton';
import { EmployeeCard } from '~/components/employees/EmployeeCard';
import { EmployeeForm } from '~/components/employees/EmployeeForm';
import { EmployeeImportSheet } from '~/components/employees/EmployeeImportSheet';
import { useEmployees } from '~/hooks/useEmployees';
import { useAuthStore } from '~/stores/auth.store';
import { employeeIdsOnApprovedLeaveToday } from '~/lib/employee-on-leave';
import type {
  ApiEmployee,
  CreateEmployeePayload,
  UpdateEmployeePayload,
} from '~/services/employee.service';
import {
  getAllLeaveRequests,
  type ApiLeaveRequest,
} from '~/services/leave-request.service';

type RowStatus = 'active' | 'on_leave' | 'inactive';

interface EmployeeRow {
  id: string;
  name: string;
  email: string;
  department: string;
  departmentId: string;
  position: string;
  status: RowStatus;
  joinedAt: string;
  raw: ApiEmployee;
}

function mapStatus(s?: string, onLeaveToday?: boolean): RowStatus {
  if (s === 'inactive' || s === 'terminated') return 'inactive';
  if (s === 'on_leave') return 'on_leave';
  if (onLeaveToday) return 'on_leave';
  return 'active';
}

function formatJoinedDate(d?: string): string {
  if (!d) return '—';
  try {
    const date = parseISO(d);
    return isValid(date) ? format(date, 'MMM d, yyyy') : '—';
  } catch {
    return '—';
  }
}

function mapEmployee(
  e: ApiEmployee,
  onLeaveTodayIds?: Set<string>
): EmployeeRow {
  const onLeaveToday =
    (onLeaveTodayIds?.has(e.id) ?? false) &&
    e.status !== 'inactive' &&
    e.status !== 'terminated';
  return {
    id: e.id,
    name: `${e.firstName} ${e.lastName}`.trim(),
    email: e.user?.email ?? '—',
    department: e.department?.name ?? '—',
    departmentId: e.department?.id ?? '',
    position: e.position?.name ?? '—',
    status: mapStatus(e.status, onLeaveToday),
    joinedAt: formatJoinedDate(e.hireDate),
    raw: e,
  };
}

function showDeactivateAccount(e: ApiEmployee): boolean {
  if (e.user?.isActive === false) return false;
  const s = e.status?.toLowerCase() ?? '';
  if (s === 'inactive' || s === 'terminated') return false;
  return true;
}

function showActivateAccount(e: ApiEmployee): boolean {
  if (e.user?.isActive === false) return true;
  const s = e.status?.toLowerCase() ?? '';
  return s === 'inactive' || s === 'terminated';
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
    <Badge
      variant="outline"
      className={cn(
        'h-6 gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        cfg.className
      )}
    >
      <span
        aria-hidden
        className={cn('size-1.5 shrink-0 rounded-full', cfg.dot)}
      />
      {cfg.label}
    </Badge>
  );
}

const STATUS_FILTER_OPTIONS: { value: RowStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On leave' },
  { value: 'inactive', label: 'Inactive' },
];

export default function EmployeesIndexPage() {
  const navigate = useNavigate();
  const headerPortal = useRef<Element | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<ApiEmployee | null>(
    null
  );
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeRow | null>(
    null
  );
  const [employeeToDeactivate, setEmployeeToDeactivate] =
    useState<EmployeeRow | null>(null);
  const [employeeToActivate, setEmployeeToActivate] =
    useState<EmployeeRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RowStatus | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(() => {
    if (typeof window === 'undefined') return 'table';
    return localStorage.getItem('employees_view') === 'grid' ? 'grid' : 'table';
  });
  const [importSheetOpen, setImportSheetOpen] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<ApiLeaveRequest[]>([]);

  const {
    employees,
    departments,
    positions,
    isLoading,
    error,
    create,
    bulkCreate,
    update,
    remove,
    deactivate,
    activate,
    createDepartment,
    createPosition,
  } = useEmployees();

  const user = useAuthStore((s) => s.user);
  const canMutate = user?.role === 'admin' || user?.role === 'super_admin';
  const canExport = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    headerPortal.current = document.getElementById('page-header');
    setPortalReady(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('employees_view', viewMode);
  }, [viewMode]);

  useEffect(() => {
    let cancelled = false;
    getAllLeaveRequests()
      .then((list) => {
        if (!cancelled) setLeaveRequests(list);
      })
      .catch(() => {
        if (!cancelled) setLeaveRequests([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onLeaveTodayIds = useMemo(
    () => employeeIdsOnApprovedLeaveToday(leaveRequests),
    [leaveRequests]
  );

  const rows = useMemo(
    () => employees.map((e) => mapEmployee(e, onLeaveTodayIds)),
    [employees, onLeaveTodayIds]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (departmentFilter !== 'all' && row.departmentId !== departmentFilter)
        return false;
      return true;
    });
  }, [rows, statusFilter, departmentFilter]);

  const displayRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredRows;
    return filteredRows.filter((row) =>
      Object.values(row as Record<string, unknown>).some((v) =>
        String(v ?? '').toLowerCase().includes(q)
      )
    );
  }, [filteredRows, searchQuery]);

  const deptColorById = useMemo(() => {
    const m: Record<string, string | undefined> = {};
    for (const d of departments) {
      m[d.id] = d.color;
    }
    return m;
  }, [departments]);

  const handleExportEmployees = () => {
    const formatEmploymentType = (type?: string) => {
      if (!type) return '';
      const t = String(type);
      const map: Record<string, string> = {
        full_time: 'Full-time',
        part_time: 'Part-time',
        contract: 'Contract',
        contractor: 'Contractor',
        intern: 'Intern',
      };
      return (
        map[t] ??
        t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      );
    };

    const formatISODate = (date?: string) => {
      if (!date) return '';
      try {
        return format(new Date(date), 'yyyy-MM-dd');
      } catch {
        return '';
      }
    };

    const rowsToExport = displayRows.map((r) => r.raw);
    const csv = convertToCSV(rowsToExport, [
      {
        key: 'name',
        label: 'Name',
        format: (_v, row) =>
          `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim(),
      },
      { key: 'user.email', label: 'Email', format: (v) => String(v ?? '') },
      {
        key: 'department.name',
        label: 'Department',
        format: (v) => String(v ?? ''),
      },
      { key: 'position.name', label: 'Position', format: (v) => String(v ?? '') },
      { key: 'status', label: 'Status', format: (v) => String(v ?? '') },
      {
        key: 'employmentType',
        label: 'Employment type',
        format: (v) => formatEmploymentType(String(v ?? '')),
      },
      {
        key: 'hireDate',
        label: 'Hire date',
        format: (v) => formatISODate(String(v ?? '')),
      },
      { key: 'phone', label: 'Phone', format: (v) => String(v ?? '') },
    ]);

    downloadCSV(csv, `employees_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.status === 'active').length;
    const onLeave = rows.filter((r) => r.status === 'on_leave').length;
    const inactive = rows.filter((r) => r.status === 'inactive').length;
    return { total, active, onLeave, inactive };
  }, [rows]);

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
            <div className="flex items-center gap-2.5">
              <Avatar className="h-7 w-7 ring-2 ring-purple ring-offset-2 ring-offset-canvas">
                {row.original.raw.avatar ? (
                  <AvatarImage
                    alt={row.original.name}
                    src={row.original.raw.avatar}
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <AvatarFallback className="bg-muted text-2xs font-semibold text-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium leading-tight text-foreground">
                  {row.original.name}
                </p>
                <p className="text-xs leading-tight text-foreground-muted">
                  {row.original.email}
                </p>
              </div>
            </div>
          );
        },
      },
      { accessorKey: 'department', header: 'Department' },
      { accessorKey: 'position', header: 'Position' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'joinedAt',
        header: 'Joined',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-foreground-muted">
            {row.original.joinedAt}
          </span>
        ),
      },
      ...(canMutate
        ? [
            {
              id: 'actions',
              header: '',
              cell: ({ row }: { row: { original: EmployeeRow } }) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setEditingEmployee(row.original.raw);
                        setSheetOpen(true);
                      }}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Edit
                    </DropdownMenuItem>
                    {showDeactivateAccount(row.original.raw) ? (
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setEmployeeToDeactivate(row.original);
                        }}
                      >
                        <UserX className="mr-2 h-3.5 w-3.5" />
                        Deactivate account
                      </DropdownMenuItem>
                    ) : null}
                    {showActivateAccount(row.original.raw) ? (
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setEmployeeToActivate(row.original);
                        }}
                      >
                        <UserCheck className="mr-2 h-3.5 w-3.5" />
                        Activate account
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={(e) => {
                        e.preventDefault();
                        setEmployeeToDelete(row.original);
                      }}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
            } as ColumnDef<EmployeeRow>,
          ]
        : []),
    ],
    [canMutate]
  );

  const handleCreateSubmit = async (
    values: CreateEmployeePayload | UpdateEmployeePayload
  ) => {
    const payload: CreateEmployeePayload = {
      firstName: values.firstName!,
      lastName: values.lastName!,
      email: values.email!,
      phone: values.phone!,
      departmentId: values.departmentId!,
      positionId: values.positionId!,
    };
    if ('avatar' in values && values.avatar) payload.avatar = values.avatar;
    if (values.managerId) payload.managerId = values.managerId;
    if (values.employmentType) payload.employmentType = values.employmentType;
    if (values.hireDate) payload.hireDate = values.hireDate;
    if (values.dateOfBirth) payload.dateOfBirth = values.dateOfBirth;
    await create(payload);
    setSheetOpen(false);
  };

  const handleUpdateSubmit = async (
    values: CreateEmployeePayload | UpdateEmployeePayload
  ) => {
    if (!editingEmployee) return;
    const payload: UpdateEmployeePayload = {};
    if (values.firstName !== undefined) payload.firstName = values.firstName;
    if (values.lastName !== undefined) payload.lastName = values.lastName;
    if (values.email !== undefined) payload.email = values.email;
    if (values.phone !== undefined) payload.phone = values.phone;
    if (values.avatar !== undefined) payload.avatar = values.avatar;
    if (values.departmentId !== undefined)
      payload.departmentId = values.departmentId;
    if (values.positionId !== undefined) payload.positionId = values.positionId;
    if (values.managerId !== undefined)
      payload.managerId = values.managerId || undefined;
    if (values.hireDate !== undefined && values.hireDate)
      payload.hireDate = values.hireDate;
    if (values.dateOfBirth !== undefined && values.dateOfBirth)
      payload.dateOfBirth = values.dateOfBirth;
    await update(editingEmployee.id, payload);
    setEditingEmployee(null);
    setSheetOpen(false);
  };

  const handleSheetClose = (open: boolean) => {
    if (!open) {
      setEditingEmployee(null);
    }
    setSheetOpen(open);
  };

  const toolbar = (
    <div className="flex flex-nowrap items-center gap-2">
      <Select
        value={statusFilter}
        onValueChange={(v) =>
          setStatusFilter((v ?? 'all') as RowStatus | 'all')
        }
      >
        <SelectTrigger className="w-[10.5rem] shrink-0 border-border bg-background md:w-44">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_FILTER_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={departmentFilter}
        onValueChange={(v) => setDepartmentFilter(v ?? 'all')}
      >
        <SelectTrigger className="w-[12rem] shrink-0 border-border bg-background md:w-52">
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All departments</SelectItem>
          {departments.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex shrink-0 items-center rounded-md border border-border p-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8 shrink-0', viewMode === 'table' && 'bg-accent')}
          aria-label="Table view"
          onClick={() => setViewMode('table')}
        >
          <LayoutList className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8 shrink-0', viewMode === 'grid' && 'bg-accent')}
          aria-label="Card view"
          onClick={() => setViewMode('grid')}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </div>
      {canExport ? (
        <ExportButton onExport={handleExportEmployees} label="Export CSV" />
      ) : null}
      {canMutate && (
        <Button
          type="button"
          variant="outline"
          className="shrink-0 gap-1.5"
          onClick={() => setImportSheetOpen(true)}
        >
          <Upload className="h-4 w-4 shrink-0" />
          Import
        </Button>
      )}
      {canMutate && (
        <Button
          className="shrink-0 gap-1.5"
          onClick={() => {
            setEditingEmployee(null);
            setSheetOpen(true);
          }}
        >
          <UserPlus className="h-4 w-4 shrink-0" />
          Add employee
        </Button>
      )}
    </div>
  );

  return (
    <>
      {portalReady && headerPortal.current
        ? createPortal(
            <div className="flex w-full items-center justify-between">
              <h1 className="text-lg font-bold text-foreground">Employees</h1>
            </div>,
            headerPortal.current
          )
        : null}

      <div className="p-6">
        {error ? (
          <div
            className="mb-4 rounded-xl border border-destructive/25 bg-destructive-muted px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {deleteError ? (
          <div
            className="mb-4 rounded-xl border border-destructive/25 bg-destructive-muted px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {deleteError}
          </div>
        ) : null}

        {!isLoading ? (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Total employees</p>
              <p className="text-2xl font-semibold text-foreground">
                {stats.total}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-semibold text-foreground">
                {stats.active}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">On leave</p>
              <p className="text-2xl font-semibold text-foreground">
                {stats.onLeave}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Inactive</p>
              <p className="text-2xl font-semibold text-foreground">
                {stats.inactive}
              </p>
            </div>
          </div>
        ) : null}

        {viewMode === 'table' ? (
          <DataTable<EmployeeRow>
            columns={columns}
            data={filteredRows}
            isLoading={isLoading}
            searchPlaceholder="Search employees…"
            toolbar={toolbar}
            globalFilter={searchQuery}
            onGlobalFilterChange={setSearchQuery}
            onRowClick={(row) => navigate(`/employees/${row.id}`)}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
              <Input
                className="w-[min(100%,18rem)] shrink-0 border-border bg-background md:w-72"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees…"
                value={searchQuery}
              />
              <div className="flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-2">
                {toolbar}
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-[280px] rounded-xl" />
                ))}
              </div>
            ) : displayRows.length === 0 ? (
              <div className="rounded-lg border border-border bg-background py-12 text-center text-sm text-muted-foreground">
                No results found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {displayRows.map((row) => (
                  <EmployeeCard
                    key={row.id}
                    employee={row.raw}
                    displayStatus={row.status}
                    canMutate={canMutate}
                    departmentColor={
                      deptColorById[row.departmentId] ?? undefined
                    }
                    onClick={() => navigate(`/employees/${row.id}`)}
                    onEdit={() => {
                      setEditingEmployee(row.raw);
                      setSheetOpen(true);
                    }}
                    onDeactivate={
                      showDeactivateAccount(row.raw)
                        ? () => setEmployeeToDeactivate(row)
                        : undefined
                    }
                    onActivate={
                      showActivateAccount(row.raw)
                        ? () => setEmployeeToActivate(row)
                        : undefined
                    }
                    onDelete={() => setEmployeeToDelete(row)}
                  />
                ))}
              </div>
            )}

            {!isLoading ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">
                  {displayRows.length} result
                  {displayRows.length !== 1 ? 's' : ''}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent className="flex min-h-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          <SheetHeader className="shrink-0 border-b px-6 pb-4 pt-6 pr-14 text-left">
            <SheetTitle>
              {editingEmployee ? 'Edit employee' : 'Add employee'}
            </SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4">
            <EmployeeForm
              mode={editingEmployee ? 'edit' : 'create'}
              employee={editingEmployee ?? undefined}
              departments={departments}
              positions={positions}
              employees={employees}
              createDepartment={createDepartment}
              createPosition={createPosition}
              onSubmit={
                editingEmployee ? handleUpdateSubmit : handleCreateSubmit
              }
              onCancel={() => handleSheetClose(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <EmployeeImportSheet
        open={importSheetOpen}
        onOpenChange={setImportSheetOpen}
        departments={departments}
        positions={positions}
        employees={employees}
        createDepartment={createDepartment}
        createPosition={createPosition}
        onImport={bulkCreate}
      />

      <AlertDialog
        open={!!employeeToDeactivate}
        onOpenChange={(open) => {
          if (!open) {
            setEmployeeToDeactivate(null);
            setDeactivateError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate account</AlertDialogTitle>
            <AlertDialogDescription>
              This signs {employeeToDeactivate?.name} out everywhere and blocks
              sign-in until you activate the account again. The employee profile
              stays in your directory.
              {deactivateError ? (
                <span className="mt-2 block text-destructive">
                  {deactivateError}
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!employeeToDeactivate) return;
                setDeactivateError(null);
                try {
                  await deactivate(employeeToDeactivate.id);
                  setEmployeeToDeactivate(null);
                } catch (err: unknown) {
                  const msg =
                    err && typeof err === 'object' && 'message' in err
                      ? String((err as { message: unknown }).message)
                      : 'Failed to deactivate account';
                  setDeactivateError(msg);
                }
              }}
            >
              Deactivate account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!employeeToActivate}
        onOpenChange={(open) => {
          if (!open) {
            setEmployeeToActivate(null);
            setActivateError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate account</AlertDialogTitle>
            <AlertDialogDescription>
              Allow {employeeToActivate?.name} to sign in again with their email
              and password.
              {activateError ? (
                <span className="mt-2 block text-destructive">
                  {activateError}
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!employeeToActivate) return;
                setActivateError(null);
                try {
                  await activate(employeeToActivate.id);
                  setEmployeeToActivate(null);
                } catch (err: unknown) {
                  const msg =
                    err && typeof err === 'object' && 'message' in err
                      ? String((err as { message: unknown }).message)
                      : 'Failed to activate account';
                  setActivateError(msg);
                }
              }}
            >
              Activate account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!employeeToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setEmployeeToDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {employeeToDelete?.name}? This
              action cannot be undone.
              {deleteError ? (
                <span className="mt-2 block text-destructive">
                  {deleteError}
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!employeeToDelete) return;
                setDeleteError(null);
                try {
                  await remove(employeeToDelete.id);
                  setEmployeeToDelete(null);
                } catch (err: unknown) {
                  const msg =
                    err && typeof err === 'object' && 'message' in err
                      ? String((err as { message: unknown }).message)
                      : 'Failed to delete employee';
                  setDeleteError(msg);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
