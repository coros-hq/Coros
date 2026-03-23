// LeaveCalendar.tsx
// Wraps react-big-calendar with date-fns localizer. Month view, custom event chips, custom toolbar.
// On event click opens a sheet with request details and approve/reject/cancel actions.

import { useMemo, useCallback, useState } from 'react';
import { Calendar, dateFnsLocalizer, type Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { LeaveRequestDetailSheet } from './LeaveRequestDetailSheet';
import type { ApiLeaveRequest } from '~/services/leave-request.service';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Color mapping per leave type (Tailwind classes for bg + text)
const LEAVE_TYPE_COLORS: Record<string, string> = {
  annual: 'bg-green-500/90 text-white',
  sick: 'bg-amber-500/90 text-white',
  unpaid: 'bg-gray-500/90 text-white',
  maternity: 'bg-purple-500/90 text-white',
  paternity: 'bg-blue-500/90 text-white',
  personal: 'bg-teal-500/90 text-white',
  other: 'bg-slate-500/90 text-white',
};

export interface CalendarLeaveEvent extends Event {
  resource: ApiLeaveRequest;
  leaveType?: string;
}

function getEventColor(leaveType: string): string {
  return LEAVE_TYPE_COLORS[leaveType?.toLowerCase()] ?? LEAVE_TYPE_COLORS.other;
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

function transformToEvents(requests: ApiLeaveRequest[]): CalendarLeaveEvent[] {
  return requests.map((r) => {
    const start = r.startDate ? new Date(r.startDate) : new Date();
    const end = r.endDate ? new Date(r.endDate) : new Date(start);
    // For all-day events, end should be end of day
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);
    const name = getEmployeeName(r.employee);
    return {
      id: r.id,
      title: name,
      start,
      end: endDate,
      resource: r,
      leaveType: r.type,
    } as CalendarLeaveEvent;
  });
}

function CustomEventComponent({
  event,
}: {
  event: CalendarLeaveEvent;
}) {
  const req = event.resource;
  const initials = getInitials(req.employee);
  const name = getEmployeeName(req.employee);
  const colorClass = getEventColor(event.leaveType ?? 'other');

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 overflow-hidden rounded px-1.5 py-0.5 text-[11px] font-medium',
        colorClass
      )}
      title={name}
    >
      <span className="shrink-0 font-semibold opacity-90">{initials}</span>
      <span className="truncate">{name}</span>
    </div>
  );
}

interface ToolbarProps {
  date: Date;
  label: string;
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY', date?: Date) => void;
}

function CustomToolbar({ label, onNavigate }: ToolbarProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onNavigate('PREV')}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onNavigate('NEXT')}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <h2 className="text-lg font-semibold text-foreground">{label}</h2>
      <div className="h-8 w-8" />
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
  const [date, setDate] = useState(new Date());
  const [selectedRequest, setSelectedRequest] = useState<ApiLeaveRequest | null>(
    null
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const events = useMemo(() => transformToEvents(requests), [requests]);

  const handleSelectEvent = useCallback((event: CalendarLeaveEvent) => {
    setSelectedRequest(event.resource);
    setSheetOpen(true);
  }, []);

  const handleSheetClose = useCallback((open: boolean) => {
    if (!open) setSelectedRequest(null);
    setSheetOpen(open);
  }, []);

  return (
    <>
      <div className="h-[600px] rounded-xl border bg-card p-4">
        <Calendar
          localizer={localizer}
          events={events}
          view="month"
          date={date}
          onNavigate={setDate}
          onSelectEvent={handleSelectEvent}
          components={{
            event: CustomEventComponent,
            toolbar: CustomToolbar,
          }}
          toolbar
          popup
          className="leave-calendar"
        />
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
