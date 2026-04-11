import { isWithinInterval, parseISO, startOfDay } from 'date-fns';
import type { ApiLeaveRequest } from '~/services/leave-request.service';

/**
 * Employees with an approved leave request that covers `asOf` (local calendar day).
 */
export function employeeIdsOnApprovedLeaveToday(
  requests: ApiLeaveRequest[],
  asOf: Date = new Date()
): Set<string> {
  const day = startOfDay(asOf);
  const ids = new Set<string>();
  for (const r of requests) {
    if (String(r.status).toLowerCase() !== 'approved') continue;
    const empId = r.employee?.id;
    if (!empId || !r.startDate || !r.endDate) continue;
    try {
      const start = startOfDay(parseISO(r.startDate));
      const end = startOfDay(parseISO(r.endDate));
      if (isWithinInterval(day, { start, end })) {
        ids.add(empId);
      }
    } catch {
      /* skip invalid dates */
    }
  }
  return ids;
}
