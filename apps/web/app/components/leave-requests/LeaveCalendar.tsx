// LeaveCalendar.tsx
// Month grid (date-fns); status-colored leave pills. Click opens LeaveRequestDetailSheet.

import { useMemo, useCallback, useState } from 'react';
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  parseISO,
  startOfDay,
  endOfDay,
  isWithinInterval,
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '~/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { LeaveRequestDetailSheet } from './LeaveRequestDetailSheet';
import type { ApiLeaveRequest } from '~/services/leave-request.service';

const WEEK_STARTS_ON = 0 as const;

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MAX_VISIBLE_PILLS = 3;

function getStatusPillClasses(status: string): string {
  const s = status?.toLowerCase() ?? '';
  switch (s) {
    case 'approved':
      return 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400';
    case 'pending':
      return 'bg-amber-500/10 border border-amber-500/20 text-amber-400';
    case 'rejected':
      return 'bg-red-500/10 border border-red-500/20 text-red-400';
    case 'cancelled':
      return 'bg-zinc-500/10 border border-zinc-500/20 text-zinc-400';
    default:
      return 'bg-amber-500/10 border border-amber-500/20 text-amber-400';
  }
}

function getInitials(emp: ApiLeaveRequest['employee']): string {
  if (!emp) return '?';
  const first = emp.firstName?.[0] ?? '';
  const last = emp.lastName?.[0] ?? '';
  return `${first}${last}`.trim().toUpperCase().slice(0, 2) || '?';
}

function getEmployeeName(emp: ApiLeaveRequest['employee']): string {
  if (!emp) return '—';
  return `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim() || '—';
}

function requestCoversDay(req: ApiLeaveRequest, day: Date): boolean {
  if (!req.startDate) return false;
  const start = startOfDay(parseISO(req.startDate));
  const end = req.endDate
    ? endOfDay(parseISO(req.endDate))
    : endOfDay(startOfDay(parseISO(req.startDate)));
  return isWithinInterval(startOfDay(day), { start, end });
}

function requestsForDay(requests: ApiLeaveRequest[], day: Date): ApiLeaveRequest[] {
  return requests.filter((r) => requestCoversDay(r, day));
}

function LeavePill({
  req,
  onClick,
}: {
  req: ApiLeaveRequest;
  onClick: () => void;
}) {
  const initials = getInitials(req.employee);
  const name = getEmployeeName(req.employee);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'flex w-full min-w-0 items-center gap-1.5 overflow-hidden rounded-md border py-0.5 pl-2 pr-2 text-left text-[11px] font-medium',
        getStatusPillClasses(req.status ?? 'pending')
      )}
      title={name}
    >
      <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-medium text-zinc-200">
        {initials}
      </span>
      <span className="truncate text-xs font-medium">{name}</span>
    </button>
  );
}

function DayCell({
  day,
  monthAnchor,
  requests,
  onSelectRequest,
}: {
  day: Date;
  monthAnchor: Date;
  requests: ApiLeaveRequest[];
  onSelectRequest: (r: ApiLeaveRequest) => void;
}) {
  const inMonth = isSameMonth(day, monthAnchor);
  const isToday = isSameDay(day, new Date());
  const dayRequests = requestsForDay(requests, day);
  const visible = dayRequests.slice(0, MAX_VISIBLE_PILLS);
  const hiddenCount = dayRequests.length - visible.length;
  const rest = dayRequests.slice(MAX_VISIBLE_PILLS);

  return (
    <div
      className={cn(
        'flex min-h-[72px] min-w-0 cursor-pointer flex-col p-1 transition-colors duration-100 hover:bg-zinc-800/30',
        !inMonth && 'bg-zinc-950/60',
        isToday && 'ring-1 ring-inset ring-violet-500/40'
      )}
    >
      <div className="mb-0.5 flex shrink-0 justify-end">
        <span
          className={cn(
            'text-sm',
            isToday ? 'font-semibold text-violet-400' : 'text-zinc-400'
          )}
        >
          {format(day, 'd')}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {visible.map((req) => (
          <LeavePill
            key={req.id}
            req={req}
            onClick={() => onSelectRequest(req)}
          />
        ))}
        {hiddenCount > 0 ? (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="text-left text-[11px] font-medium text-zinc-500 hover:text-zinc-300"
                onClick={(e) => e.stopPropagation()}
              >
                +{hiddenCount} more
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="max-h-64 w-64 overflow-y-auto border-zinc-800 bg-zinc-900 p-2 text-zinc-300"
              align="start"
            >
              <ul className="space-y-1">
                {rest.map((req) => (
                  <li key={req.id}>
                    <LeavePill
                      req={req}
                      onClick={() => onSelectRequest(req)}
                    />
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        ) : null}
      </div>
    </div>
  );
}

export interface LeaveCalendarProps {
  requests: ApiLeaveRequest[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
  currentEmployeeId?: string | null;
  isAdmin?: boolean;
}

export function LeaveCalendar({
  requests,
  onApprove,
  onReject,
  onCancel,
  currentEmployeeId,
  isAdmin = false,
}: LeaveCalendarProps) {
  const [date, setDate] = useState(() => new Date());
  const [selectedRequest, setSelectedRequest] = useState<ApiLeaveRequest | null>(
    null
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const { weekDays, rowCount } = useMemo(() => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const rangeStart = startOfWeek(monthStart, {
      weekStartsOn: WEEK_STARTS_ON,
    });
    const rangeEnd = endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON });
    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
    return {
      weekDays: days,
      rowCount: Math.ceil(days.length / 7),
    };
  }, [date]);

  const monthLabel = format(date, 'MMMM yyyy', { locale: enUS });

  const handleSelectRequest = useCallback((r: ApiLeaveRequest) => {
    setSelectedRequest(r);
    setSheetOpen(true);
  }, []);

  const handleSheetClose = useCallback((open: boolean) => {
    if (!open) setSelectedRequest(null);
    setSheetOpen(open);
  }, []);

  return (
    <>
      <div className="flex h-[600px] flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
              onClick={() => setDate((d) => subMonths(d, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
              onClick={() => setDate((d) => addMonths(d, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-100">
            {monthLabel}
          </h2>
          <div className="size-7 shrink-0" aria-hidden />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-zinc-800/60">
          <div className="grid shrink-0 grid-cols-7 border-b border-zinc-800/60">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="px-1 py-2 text-center text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500"
              >
                {label}
              </div>
            ))}
          </div>
          <div
            className="grid min-h-0 flex-1 grid-cols-7 divide-x divide-y divide-zinc-800/60"
            style={{
              gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))`,
            }}
          >
            {weekDays.map((day) => (
              <DayCell
                key={day.getTime()}
                day={day}
                monthAnchor={date}
                requests={requests}
                onSelectRequest={handleSelectRequest}
              />
            ))}
          </div>
        </div>
      </div>
      <LeaveRequestDetailSheet
        request={selectedRequest}
        open={sheetOpen}
        onOpenChange={handleSheetClose}
        onApprove={onApprove}
        onReject={onReject}
        onCancel={onCancel}
        currentEmployeeId={currentEmployeeId}
        isAdmin={isAdmin}
      />
    </>
  );
}
