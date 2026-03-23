// LeaveRequestDetailSheet.tsx
// Sheet shown when clicking a calendar event. Displays request details with
// Approve/Reject (Admin/Manager) or Cancel (Employee) actions for pending requests.

import { differenceInDays, format, parseISO, isValid } from 'date-fns';
import { Ban, Check, X } from 'lucide-react';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import { cn } from '~/lib/utils';
import type { ApiLeaveRequest } from '~/services/leave-request.service';

type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
  },
  approved: {
    label: 'Approved',
    className: 'border-green-500/30 bg-green-500/10 text-green-700',
  },
  rejected: {
    label: 'Rejected',
    className: 'border-red-500/30 bg-red-500/10 text-red-700',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'border-gray-500/30 bg-gray-500/10 text-gray-700',
  },
};

function formatDate(d?: string): string {
  if (!d) return '—';
  try {
    const date = parseISO(d);
    return isValid(date) ? format(date, 'MMM d, yyyy') : '—';
  } catch {
    return '—';
  }
}

function capitalizeType(t: string): string {
  if (!t) return '—';
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

export interface LeaveRequestDetailSheetProps {
  request: ApiLeaveRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
  currentEmployeeId?: string | null;
  isAdmin?: boolean;
}

export function LeaveRequestDetailSheet({
  request,
  open,
  onOpenChange,
  onApprove,
  onReject,
  onCancel,
  currentEmployeeId,
  isAdmin = false,
}: LeaveRequestDetailSheetProps) {
  if (!request) return null;

  const emp = request.employee;
  const employeeName = emp
    ? `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim()
    : '—';
  const start = request.startDate ? new Date(request.startDate) : null;
  const end = request.endDate ? new Date(request.endDate) : null;
  const duration =
    start && end ? differenceInDays(end, start) + 1 : 0;
  const status = (request.status as RequestStatus) ?? 'pending';
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  const canApproveReject = isAdmin && status === 'pending';
  const canCancel =
    !isAdmin && status === 'pending' && currentEmployeeId === emp?.id;

  const handleApprove = () => {
    onApprove?.(request.id);
    onOpenChange(false);
  };
  const handleReject = () => {
    onReject?.(request.id);
    onOpenChange(false);
  };
  const handleCancel = () => {
    onCancel?.(request.id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Leave request details</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Employee
            </p>
            <p className="text-sm font-medium text-foreground">{employeeName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Leave type
            </p>
            <p className="text-sm font-medium text-foreground capitalize">
              {capitalizeType(request.type?.replace('_', ' ') ?? '')}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Dates</p>
            <p className="text-sm font-medium text-foreground">
              {formatDate(request.startDate)} – {formatDate(request.endDate)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Duration
            </p>
            <p className="text-sm font-medium text-foreground">
              {duration} day{duration !== 1 ? 's' : ''}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Status</p>
            <Badge
              variant="outline"
              className={cn(
                'mt-0.5 border px-2 py-0.5 text-xs font-medium',
                statusCfg.className
              )}
            >
              {statusCfg.label}
            </Badge>
          </div>
          {request.reason ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Reason
              </p>
              <p className="mt-0.5 text-sm text-foreground">
                {request.reason}
              </p>
            </div>
          ) : null}

          {(canApproveReject || canCancel) && (
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
              {canApproveReject && (
                <>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleReject}
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </>
              )}
              {canCancel && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleCancel}
                >
                  <Ban className="h-3.5 w-3.5" />
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
