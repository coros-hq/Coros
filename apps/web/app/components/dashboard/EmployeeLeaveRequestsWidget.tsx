// Pending leave requests for the current employee (read-only, link to full page)

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { CalendarOff, ChevronRight } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';

import { Button } from '~/components/ui/button';
import { getAllLeaveRequests } from '~/services/leave-request.service';
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

export function EmployeeLeaveRequestsWidget() {
  const [pending, setPending] = useState<ApiLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
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
    load();
  }, [load]);

  if (loading) {
    return (
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarOff className="size-4" />
          My leave requests
        </h2>
        <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarOff className="size-4" />
          My leave requests
        </h2>
        <Button asChild size="sm" variant="ghost" className="h-7 gap-1 text-xs text-muted-foreground">
          <Link to="/leave-requests">
            View all
            <ChevronRight className="size-3.5" />
          </Link>
        </Button>
      </div>
      {pending.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No pending leave requests.{' '}
          <Link className="text-primary underline-offset-4 hover:underline" to="/leave-requests">
            Submit a request
          </Link>
        </p>
      ) : (
        <ul className="space-y-2">
          {pending.slice(0, 5).map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium capitalize text-foreground">{r.type}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(r.startDate)} – {formatDate(r.endDate)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-warning-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warning">
                Pending
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
