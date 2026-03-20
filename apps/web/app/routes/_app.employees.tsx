import { useEffect, useMemo, useRef, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { MoreHorizontal, Pencil, Trash2, UserPlus } from 'lucide-react';

import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { DataTable } from '~/components/data-table/DataTable';
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
import { cn } from '~/lib/utils';
import { EmployeeForm } from '~/components/employees/EmployeeForm';
import { useEmployees } from '~/hooks/useEmployees';
import { useAuthStore } from '~/stores/auth.store';
import type {
  ApiEmployee,
  CreateEmployeePayload,
  UpdateEmployeePayload,
} from '~/services/employee.service';

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

function mapStatus(s?: string): RowStatus {
  if (s === 'on_leave') return 'on_leave';
  if (s === 'inactive' || s === 'terminated') return 'inactive';
  return 'active';
}

function formatDate(d?: string): string {
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
    departmentId: e.department?.id ?? '',
    position: e.position?.name ?? '—',
    status: mapStatus(e.status),
    joinedAt: formatDate(e.hireDate),
    raw: e,
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

export default function EmployeesPage() {
  const navigate = useNavigate();
  const headerPortal = useRef<Element | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<ApiEmployee | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<RowStatus | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const {
    employees,
    departments,
    positions,
    isLoading,
    error,
    create,
    update,
    remove,
  } = useEmployees();
  const user = useAuthStore((s) => s.user);
  const canMutate = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    headerPortal.current = document.getElementById('page-header');
    setPortalReady(true);
  }, []);

  const rows = useMemo(() => employees.map(mapEmployee), [employees]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (departmentFilter !== 'all' && row.departmentId !== departmentFilter)
        return false;
      return true;
    });
  }, [rows, statusFilter, departmentFilter]);

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
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7"
                        aria-label="Actions"
                      />
                    }
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
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
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onSelect={(e) => {
                        e.preventDefault();
                        if (
                          window.confirm(
                            `Delete ${row.original.name}? This cannot be undone.`
                          )
                        ) {
                          remove(row.original.id);
                        }
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
    [canMutate, remove]
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
    if (values.managerId) payload.managerId = values.managerId;
    if (values.employmentType) payload.employmentType = values.employmentType;
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
    if (values.departmentId !== undefined)
      payload.departmentId = values.departmentId;
    if (values.positionId !== undefined) payload.positionId = values.positionId;
    if (values.managerId !== undefined)
      payload.managerId = values.managerId || undefined;
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
        <SelectTrigger
          className="h-10 w-[min(100%,11rem)] min-w-[9.5rem] border-border bg-card text-sm text-foreground"
        >
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
        <SelectTrigger
          className="h-10 w-[min(100%,14rem)] min-w-[11rem] border-border bg-card text-sm text-foreground"
        >
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
      {canMutate && (
        <Button
          className="h-10 gap-1.5 px-4 text-sm"
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

        <DataTable<EmployeeRow>
          columns={columns}
          data={filteredRows}
          isLoading={isLoading}
          searchPlaceholder="Search employees…"
          toolbar={toolbar}
          onRowClick={(row) => navigate(`/employees/${row.id}`)}
        />
      </div>

      <Sheet open={sheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editingEmployee ? 'Edit employee' : 'Add employee'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <EmployeeForm
              mode={editingEmployee ? 'edit' : 'create'}
              employee={editingEmployee ?? undefined}
              departments={departments}
              positions={positions}
              employees={employees}
              onSubmit={
                editingEmployee ? handleUpdateSubmit : handleCreateSubmit
              }
              onCancel={() => handleSheetClose(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
