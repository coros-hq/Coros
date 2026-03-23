// PendingLeaveRequestsWidget.tsx
// For Admin/Manager: pending leave requests with inline approve/reject

import { useCallback, useEffect, useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { CalendarOff, Check, Loader2, X } from 'lucide-react';

import { Button } from '~/components/ui/button';
import {
  approveLeaveRequest,
  getAllLeaveRequests,
  rejectLeaveRequest,
} from '~/services/leave-request.service';
import { useAuthStore } from '~/stores/auth.store';
import type { ApiLeaveRequest } from '~/services/leave-request.service';

function formatDate(d?: string): string {
  if (!d) return '—';
  try {
    const date = parseISO(d);
    return isValid(date) ? format(date, 'MMM d') : '—';
  } catch {
    return '—';
  }
}

export function PendingLeaveRequestsWidget() {
  const user = useAuthStore((s) => s.user);
  const isAdmin =
    user?.role === 'admin' ||
    user?.role === 'manager' ||
    user?.role === 'super_admin';

  const [pending, setPending] = useState<ApiLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllLeaveRequests();
      setPending(all.filter((r) => r.status === 'pending'));
    } catch {
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) refetch();
  }, [isAdmin, refetch]);

  const handleApprove = async (id: string) => {
    setActioning(id);
    try {
      await approveLeaveRequest(id);
      await refetch();
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (id: string) => {
    setActioning(id);
    try {
      await rejectLeaveRequest(id);
      await refetch();
    } finally {
      setActioning(null);
    }
  };

  if (!isAdmin) return null;
  if (loading) {
    return (
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarOff className="size-4" />
          Pending leave requests
        </h2>
        <p className="py-4 text-center text-sm text-muted-foreground">
          Loading…
        </p>
      </section>
    );
  }
  if (pending.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarOff className="size-4" />
          Pending leave requests
        </h2>
        <p className="py-4 text-center text-sm text-muted-foreground">
          No pending requests
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <CalendarOff className="size-4" />
        Pending leave requests
      </h2>
      <ul className="space-y-2">
        {pending.slice(0, 5).map((r) => {
          const name = r.employee
            ? `${r.employee.firstName ?? ''} ${r.employee.lastName ?? ''}`.trim()
            : '—';
          const busy = actioning === r.id;
          return (
            <li
              key={r.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">
                  {r.type} · {formatDate(r.startDate)} – {formatDate(r.endDate)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 text-success hover:bg-success-muted hover:text-success"
                  onClick={() => handleApprove(r.id)}
                  disabled={busy}
                  aria-label="Approve"
                >
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:bg-destructive-muted hover:text-destructive"
                  onClick={() => handleReject(r.id)}
                  disabled={busy}
                  aria-label="Reject"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
