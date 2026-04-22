// LeaveCalendar.tsx
// Month grid (date-fns); leave-type-colored bars; click opens LeaveRequestDetailSheet.
// Leave `type` strings match `LeaveType` in `@org/shared-types`.

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
import { LeaveRequestDetailSheet } from './LeaveRequestDetailSheet';
import type { ApiLeaveRequest } from '~/services/leave-request.service';

const WEEK_STARTS_ON = 0 as const;

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Max event pills if we need a fallback; used for +N more footers. */
const MAX_VISIBLE_PILLS = 2;

const BAR_TOP_BASE_PX = 28;
const BAR_TOP_STEP_PX = 20;

type LeaveTypeBarColor = {
  /** Light fill, pill-style (e.g. bg-green-100 on Approved-style chips) */
  bg: string;
  border: string;
  text: string;
  /** Solid circle behind initials; contrast for white text */
  dot: string;
};

const LEAVE_TYPE_BAR: Record<string, LeaveTypeBarColor> = {
  vacation: {
    bg: 'bg-blue-100',
    border: 'border-blue-200',
    text: 'text-blue-800',
    dot: 'bg-blue-600',
  },
  annual: {
    bg: 'bg-blue-100',
    border: 'border-blue-200',
    text: 'text-blue-800',
    dot: 'bg-blue-600',
  },
  sick: {
    bg: 'bg-rose-100',
    border: 'border-rose-200',
    text: 'text-rose-800',
    dot: 'bg-rose-600',
  },
  personal: {
    bg: 'bg-violet-100',
    border: 'border-violet-200',
    text: 'text-violet-800',
    dot: 'bg-violet-600',
  },
  maternity: {
    bg: 'bg-pink-100',
    border: 'border-pink-200',
    text: 'text-pink-800',
    dot: 'bg-pink-600',
  },
  paternity: {
    bg: 'bg-pink-100',
    border: 'border-pink-200',
    text: 'text-pink-800',
    dot: 'bg-pink-600',
  },
  unpaid: {
    bg: 'bg-zinc-100',
    border: 'border-zinc-200',
    text: 'text-zinc-800',
    dot: 'bg-zinc-600',
  },
  other: {
    bg: 'bg-amber-100',
    border: 'border-amber-200',
    text: 'text-amber-800',
    dot: 'bg-amber-600',
  },
};

/** Group keys for the legend (maternity + paternity share one row; order = display). */
const LEAVE_TYPE_LEGEND_ORDER: { key: string; label: string }[] = [
  { key: 'vacation', label: 'Vacation' },
  { key: 'annual', label: 'Annual' },
  { key: 'sick', label: 'Sick Leave' },
  { key: 'personal', label: 'Personal' },
  { key: 'maternity_paternity', label: 'Maternity / Paternity' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'other', label: 'Other' },
];

function normalizeLeaveTypeKey(type: string | undefined): keyof typeof LEAVE_TYPE_BAR | 'maternity_paternity' {
  const t = (type ?? 'other').toLowerCase();
  if (t === 'maternity' || t === 'paternity') return 'maternity_paternity';
  if (t in LEAVE_TYPE_BAR) return t as keyof typeof LEAVE_TYPE_BAR;
  return 'other';
}

function getLeaveTypeBarColor(type: string | undefined): LeaveTypeBarColor {
  const k = normalizeLeaveTypeKey(type);
  if (k === 'maternity_paternity') {
    return LEAVE_TYPE_BAR.maternity;
  }
  return LEAVE_TYPE_BAR[k] ?? LEAVE_TYPE_BAR.other;
}

/** Key used for the calendar legend (maternity and paternity share one). */
function getLegendKeyForType(type: string | undefined): string {
  const t = (type ?? 'other').toLowerCase();
  if (t === 'maternity' || t === 'paternity') return 'maternity_paternity';
  if (t in LEAVE_TYPE_BAR) return t;
  return 'other';
}

function getLegendPillClass(legendKey: string): string {
  const c =
    legendKey === 'maternity_paternity'
      ? LEAVE_TYPE_BAR.maternity
      : (LEAVE_TYPE_BAR[legendKey] ?? LEAVE_TYPE_BAR.other);
  return cn('size-2.5 rounded-full border', c.border, c.bg);
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

function requestOverlapsMonth(req: ApiLeaveRequest, month: Date): boolean {
  if (!req.startDate) return false;
  const start = startOfDay(parseISO(req.startDate));
  const end = req.endDate
    ? endOfDay(parseISO(req.endDate))
    : endOfDay(startOfDay(parseISO(req.startDate)));
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  return start <= monthEnd && end >= monthStart;
}

function requestsForDay(requests: ApiLeaveRequest[], day: Date): ApiLeaveRequest[] {
  return requests.filter((r) => requestCoversDay(r, day));
}

type WeekSegment = {
  req: ApiLeaveRequest;
  startCol: number;
  endCol: number;
  isStart: boolean;
  isEnd: boolean;
  stackIndex: number;
};

function getLeaveDateBounds(req: ApiLeaveRequest) {
  const start = startOfDay(parseISO(req.startDate));
  const end = req.endDate
    ? startOfDay(parseISO(req.endDate))
    : startOfDay(parseISO(req.startDate));
  return { start, end };
}

function assignStackIndices(segments: Omit<WeekSegment, 'stackIndex'>[]): WeekSegment[] {
  const byStart = [...segments].sort(
    (a, b) => a.startCol - b.startCol || a.endCol - b.endCol
  );
  const stackEnds: number[] = [];

  return byStart.map((seg) => {
    for (let s = 0; s < stackEnds.length; s++) {
      if (seg.startCol > stackEnds[s]) {
        stackEnds[s] = seg.endCol;
        return { ...seg, stackIndex: s };
      }
    }
    stackEnds.push(seg.endCol);
    return { ...seg, stackIndex: stackEnds.length - 1 };
  });
}

/**
 * On each row, a segment is included if the leave range intersects at least one
 * of the row's calendar days. startCol/endCol are 0–6 (Sun–Sat) within that week.
 * Pairwise overlap in columns → different stack.
 */
function computeWeekSegments(
  rowDays: Date[],
  req: ApiLeaveRequest
): Omit<WeekSegment, 'stackIndex'> | null {
  if (!req.startDate) return null;
  const { start: leaveStart, end: leaveEnd } = getLeaveDateBounds(req);
  const rowFirst = startOfDay(rowDays[0]);
  const rowLast = startOfDay(rowDays[6]);

  if (leaveEnd < rowFirst || leaveStart > rowLast) {
    return null;
  }

  let startCol = -1;
  let endCol = -1;
  for (let i = 0; i < 7; i++) {
    const d = startOfDay(rowDays[i]);
    if (leaveStart <= d && d <= leaveEnd) {
      if (startCol < 0) startCol = i;
      endCol = i;
    }
  }
  if (startCol < 0 || endCol < 0) {
    return null;
  }

  const isStart = isSameDay(rowDays[startCol], leaveStart);
  const isEnd = isSameDay(rowDays[endCol], leaveEnd);

  return { req, startCol, endCol, isStart, isEnd };
}

function LeaveBarPill({
  seg,
  onClick,
}: {
  seg: WeekSegment;
  onClick: () => void;
}) {
  const { req, isStart, isEnd } = seg;
  const status = (req.status ?? '').toLowerCase();
  const isPending = status === 'pending';
  const color = getLeaveTypeBarColor(req.type);
  const initials = getInitials(req.employee);
  const firstName = req.employee?.firstName?.trim() || '—';
  const fullName = getEmployeeName(req.employee);

  const roundClasses = cn(
    isStart && isEnd && 'rounded-full',
    isStart && !isEnd && 'rounded-l-full',
    !isStart && isEnd && 'rounded-r-full',
    !isStart && !isEnd && 'rounded-none'
  );

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'flex h-5 w-full min-w-0 items-center justify-start gap-1.5 overflow-hidden border px-1.5 text-left text-xs font-medium',
        color.bg,
        color.border,
        color.text,
        isPending && 'opacity-80',
        roundClasses
      )}
      title={fullName}
    >
      {isPending ? (
        <span className="ml-0.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
      ) : null}
      <span
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white',
          color.dot
        )}
      >
        {initials}
      </span>
      <span className="min-w-0 flex-1 truncate pr-0.5">{firstName}</span>
    </button>
  );
}

function WeekRow({
  rowDays,
  monthAnchor,
  requests,
  onSelectRequest,
}: {
  rowDays: Date[];
  monthAnchor: Date;
  requests: ApiLeaveRequest[];
  onSelectRequest: (r: ApiLeaveRequest) => void;
}) {
  const raw: Omit<WeekSegment, 'stackIndex'>[] = [];
  for (const req of requests) {
    const s = computeWeekSegments(rowDays, req);
    if (s) raw.push(s);
  }
  const withStacks = assignStackIndices(raw);
  const maxStack =
    withStacks.length === 0
      ? 0
      : Math.max(...withStacks.map((s) => s.stackIndex)) + 1;
  const rowMinHeight = Math.max(80, BAR_TOP_BASE_PX + maxStack * BAR_TOP_STEP_PX + 8);

  return (
    <div
      className="relative min-h-[80px] border-b border-zinc-200/90"
      style={{ minHeight: rowMinHeight }}
    >
      <div className="relative z-0 grid min-h-0 grid-cols-7 divide-x divide-zinc-200/90">
        {rowDays.map((day) => {
          const inMonth = isSameMonth(day, monthAnchor);
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={day.getTime()}
              className={cn(
                'flex min-w-0 flex-col p-1 transition-colors duration-100 hover:bg-zinc-100/90',
                !inMonth && 'bg-zinc-100/70'
              )}
            >
              <div className="mb-0.5 flex shrink-0 justify-end">
                {isToday ? (
                  <span className="flex size-6 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white">
                    {format(day, 'd')}
                  </span>
                ) : (
                  <span className="text-sm text-zinc-600">{format(day, 'd')}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {rowDays.map((day, col) => {
        const dayList = requestsForDay(requests, day);
        const visible = dayList.slice(0, MAX_VISIBLE_PILLS);
        const hiddenCount = dayList.length - visible.length;
        if (hiddenCount <= 0) return null;
        return (
          <div
            key={`footer-${day.getTime()}`}
            className="pointer-events-none absolute bottom-1 z-[1] text-[10px] text-zinc-400"
            style={{
              left: `calc(${col} / 7 * 100%)`,
              width: 'calc(100% / 7)',
            }}
          >
            <div className="px-1 text-center">+{hiddenCount} more</div>
          </div>
        );
      })}

      <div className="pointer-events-none absolute inset-0 z-[2] min-h-0">
        {withStacks.map((seg) => {
          const top = BAR_TOP_BASE_PX + seg.stackIndex * BAR_TOP_STEP_PX;
          return (
            <div
              key={`${seg.req.id}-${rowDays[0].getTime()}`}
              className="pointer-events-auto absolute px-0.5"
              style={{
                left: `calc(${seg.startCol} / 7 * 100%)`,
                width: `calc((${seg.endCol} - ${seg.startCol} + 1) / 7 * 100%)`,
                top,
              }}
            >
              <LeaveBarPill
                seg={seg}
                onClick={() => onSelectRequest(seg.req)}
              />
            </div>
          );
        })}
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

  const { weekRows, rowCount } = useMemo(() => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const rangeStart = startOfWeek(monthStart, {
      weekStartsOn: WEEK_STARTS_ON,
    });
    const rangeEnd = endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON });
    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
    const rows: Date[][] = [];
    for (let r = 0; r < days.length; r += 7) {
      rows.push(days.slice(r, r + 7));
    }
    return {
      weekRows: rows,
      rowCount: rows.length,
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

  const calendarRequests = useMemo(
    () =>
      requests.filter(
        (r) => (r.status?.toLowerCase() ?? '') !== 'rejected'
      ),
    [requests]
  );

  const activeLeaveTypeLegend = useMemo(() => {
    const seen = new Set<string>();
    for (const r of calendarRequests) {
      if (!requestOverlapsMonth(r, date)) continue;
      seen.add(getLegendKeyForType(r.type));
    }
    return LEAVE_TYPE_LEGEND_ORDER.filter((row) => seen.has(row.key));
  }, [calendarRequests, date]);

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        {activeLeaveTypeLegend.map((row) => (
          <div key={row.key} className="flex items-center gap-1.5">
            <span className={getLegendPillClass(row.key)} aria-hidden />
            <span className="text-xs text-zinc-500">{row.label}</span>
          </div>
        ))}
      </div>
      <div className="flex h-[600px] flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              onClick={() => setDate((d) => subMonths(d, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              onClick={() => setDate((d) => addMonths(d, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-900">
            {monthLabel}
          </h2>
          <div className="size-7 shrink-0" aria-hidden />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-zinc-200/90">
          <div className="grid shrink-0 grid-cols-7 border-b border-zinc-200/90">
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
            className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto"
            style={{ gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))` }}
          >
            {weekRows.map((rowDays) => (
              <WeekRow
                key={rowDays[0].getTime()}
                rowDays={rowDays}
                monthAnchor={date}
                requests={calendarRequests}
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
