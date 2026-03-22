import { useEffect, useMemo, useRef, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { createPortal } from 'react-dom';
import { differenceInDays, format, parseISO, isValid } from 'date-fns';
import { Ban, CalendarDays, Check, MoreHorizontal, Pencil, X } from 'lucide-react';

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
import { LeaveRequestForm } from '~/components/leave-requests/LeaveRequestForm';
import { useLeaveRequests } from '~/hooks/useLeaveRequests';
import { useAuthStore } from '~/stores/auth.store';
import type { ApiLeaveRequest } from '~/services/leave-request.service';

type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

interface LeaveRequestRow {
  id: string;
  employeeName: string;
  employeeEmail: string;
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  duration: number;
  status: RequestStatus;
  reason: string;
  raw: ApiLeaveRequest;
}

function formatDate(d?: string): string {
  if (!d) return '—';
  try {
    const date = parseISO(d);
    return isValid(date) ? format(date, 'yyyy-MM-dd') : '—';
  } catch {
    return '—';
  }
}

function truncate(text: string, max = 40): string {
  if (!text) return '—';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function mapRequest(r: ApiLeaveRequest): LeaveRequestRow {
  const start = r.startDate ? new Date(r.startDate) : null;
  const end = r.endDate ? new Date(r.endDate) : null;
  const duration =
    start && end ? differenceInDays(end, start) + 1 : 0;
  const emp = r.employee;
  const name = emp
    ? `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim()
    : '—';
  const email = emp?.user?.email ?? '—';

  return {
    id: r.id,
    employeeId: emp?.id ?? '',
    employeeName: name,
    employeeEmail: email,
    type: r.type ?? '',
    startDate: r.startDate ?? '',
    endDate: r.endDate ?? '',
    duration,
    status: (r.status as RequestStatus) ?? 'pending',
    reason: r.reason ?? '',
    raw: r,
  };
}

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending',
    className: 'border-warning/30 bg-warning-muted text-warning',
  },
  approved: {
    label: 'Approved',
    className: 'border-success/30 bg-success-muted text-success',
  },
  rejected: {
    label: 'Rejected',
    className: 'border-destructive/30 bg-destructive-muted text-destructive',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'border-muted bg-muted text-muted-foreground',
  },
};

function StatusBadge({ status }: { status: RequestStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <Badge
      variant="outline"
      className={cn(
        'h-6 gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        cfg.className
      )}
    >
      {cfg.label}
    </Badge>
  );
}

function capitalizeType(t: string): string {
  if (!t) return '—';
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

const STATUS_FILTER_OPTIONS: { value: RequestStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const TYPE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'annual', label: 'Annual' },
  { value: 'sick', label: 'Sick' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'maternity', label: 'Maternity' },
  { value: 'paternity', label: 'Paternity' },
];

export default function LeaveRequestsPage() {
  const headerPortal = useRef<Element | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ApiLeaveRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    requests,
    balances,
    employee,
    employees,
    isLoading,
    error,
    create,
    update,
    approve,
    reject,
    cancel,
  } = useLeaveRequests();

  const user = useAuthStore((s) => s.user);
  const isAdmin =
    user?.role === 'admin' || user?.role === 'manager' || user?.role === 'super_admin';

  useEffect(() => {
    headerPortal.current = document.getElementById('page-header');
    setPortalReady(true);
  }, []);

  const rows = useMemo(() => requests.map(mapRequest), [requests]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (typeFilter !== 'all' && row.type !== typeFilter) return false;
      return true;
    });
  }, [rows, statusFilter, typeFilter]);

  const columns = useMemo<ColumnDef<LeaveRequestRow>[]>(
    () => [
      ...(isAdmin
        ? [
            {
              accessorKey: 'employeeName',
              header: 'Employee',
              cell: ({ row }: { row: { original: LeaveRequestRow } }) => {
                const initials = row.original.employeeName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7 ring-2 ring-purple ring-offset-2 ring-offset-canvas">
                      <AvatarFallback className="bg-muted text-2xs font-semibold text-foreground">
                        {initials || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-tight text-foreground">
                        {row.original.employeeName}
                      </p>
                      <p className="text-xs leading-tight text-foreground-muted">
                        {row.original.employeeEmail}
                      </p>
                    </div>
                  </div>
                );
              },
            } as ColumnDef<LeaveRequestRow>,
          ]
        : []),
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <span className="capitalize">
            {capitalizeType(row.original.type.replace('_', ' '))}
          </span>
        ),
      },
      {
        accessorKey: 'startDate',
        header: 'Start date',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-foreground">
            {formatDate(row.original.startDate)}
          </span>
        ),
      },
      {
        accessorKey: 'endDate',
        header: 'End date',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-foreground">
            {formatDate(row.original.endDate)}
          </span>
        ),
      },
      {
        accessorKey: 'duration',
        header: 'Duration',
        cell: ({ row }) => (
          <span className="text-foreground">
            {row.original.duration} day{row.original.duration !== 1 ? 's' : ''}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} />
        ),
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => (
          <span className="max-w-[12rem] truncate text-muted-foreground">
            {truncate(row.original.reason, 30)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }: { row: { original: LeaveRequestRow } }) => {
          const r = row.original;
          const canApproveReject =
            isAdmin && r.status === 'pending';
          const canEdit =
            (r.status === 'pending' || r.status === 'approved') &&
            (isAdmin || r.employeeId === employee?.id);
          const canCancel =
            !isAdmin &&
            r.status === 'pending' &&
            r.employeeId === employee?.id;

          if (!canApproveReject && !canEdit && !canCancel) return null;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {canEdit && (
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setEditingRequest(r.raw);
                      setSheetOpen(true);
                    }}
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canApproveReject && (
                  <>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        approve(r.id);
                      }}
                    >
                      <Check className="mr-2 h-3.5 w-3.5" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={(e) => {
                        e.preventDefault();
                        reject(r.id);
                      }}
                    >
                      <X className="mr-2 h-3.5 w-3.5" />
                      Reject
                    </DropdownMenuItem>
                  </>
                )}
                {canCancel && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => {
                      e.preventDefault();
                      cancel(r.id);
                    }}
                  >
                    <Ban className="mr-2 h-3.5 w-3.5" />
                    Cancel
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [isAdmin, employee?.id, approve, reject, cancel, setEditingRequest, setSheetOpen]
  );

  const toolbar = (
    <div className="flex flex-nowrap items-center gap-2">
      <Select
        value={statusFilter}
        onValueChange={(v) =>
          setStatusFilter((v ?? 'all') as RequestStatus | 'all')
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
      <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? 'all')}>
        <SelectTrigger className="w-[10.5rem] shrink-0 border-border bg-background md:w-44">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          {TYPE_FILTER_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        className="shrink-0 gap-1.5"
        onClick={() => setSheetOpen(true)}
      >
        <CalendarDays className="h-4 w-4 shrink-0" />
        Request leave
      </Button>
    </div>
  );

  const handleCreateSubmit = async (values: {
    type: string;
    startDate: string;
    endDate: string;
    reason?: string;
    employeeId: string;
  }) => {
    setIsSubmitting(true);
    try {
      await create({
        type: values.type,
        startDate: values.startDate,
        endDate: values.endDate,
        reason: values.reason,
        employeeId: values.employeeId,
      });
      setSheetOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSheetClose = (open: boolean) => {
    if (!open) setEditingRequest(null);
    setSheetOpen(open);
  };

  const handleUpdateSubmit = async (values: {
    type: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }) => {
    if (!editingRequest) return;
    setIsSubmitting(true);
    try {
      await update(editingRequest.id, {
        type: values.type,
        startDate: values.startDate,
        endDate: values.endDate,
        reason: values.reason,
      });
      setSheetOpen(false);
      setEditingRequest(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {portalReady && headerPortal.current
        ? createPortal(
            <div className="flex w-full items-center justify-between">
              <h1 className="text-lg font-bold text-foreground">
                Leave Requests
              </h1>
              <Button
                className="bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                size="sm"
                type="button"
                onClick={() => setSheetOpen(true)}
              >
                + Request leave
              </Button>
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

        {!isLoading && balances.length > 0 ? (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {balances.map((balance) => (
              <div
                key={balance.id}
                className="rounded-lg border bg-card p-4"
              >
                <p className="text-xs text-muted-foreground capitalize">
                  {balance.type.replace('_', ' ')}
                </p>
                <p className="text-2xl font-semibold text-foreground">
                  {balance.remaining}
                </p>
                <p className="text-xs text-muted-foreground">
                  of {balance.total} days
                </p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{
                      width: `${Math.min(
                        (balance.total > 0
                          ? (balance.remaining / balance.total) * 100
                          : 0),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!isLoading && filteredRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              No leave requests yet
            </p>
            <p className="mb-4 text-sm text-muted-foreground">
              Submit your first leave request
            </p>
            <Button onClick={() => setSheetOpen(true)}>+ Request leave</Button>
          </div>
        ) : (
          <DataTable<LeaveRequestRow>
            columns={columns}
            data={filteredRows}
            isLoading={isLoading}
            searchPlaceholder="Search requests…"
            toolbar={toolbar}
          />
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editingRequest ? 'Edit leave request' : 'Request leave'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <LeaveRequestForm
              open={sheetOpen}
              onOpenChange={setSheetOpen}
              onSubmit={handleCreateSubmit}
              onUpdate={handleUpdateSubmit}
              employeeId={employee?.id ?? null}
              employees={employees}
              isAdmin={isAdmin}
              initialRequest={
                editingRequest
                  ? {
                      id: editingRequest.id,
                      type: editingRequest.type,
                      startDate: editingRequest.startDate,
                      endDate: editingRequest.endDate,
                      reason: editingRequest.reason ?? undefined,
                      employeeId: editingRequest.employee?.id,
                    }
                  : undefined
              }
              isSubmitting={isSubmitting}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
