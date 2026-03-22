# Leave Requests Page — Implementation Plan

## Backend (Completed)

The following endpoints were added:

| Endpoint | Description |
|----------|-------------|
| `GET /me/employee` | Returns current user's employee record. 404 if none. JwtAuthGuard, all roles. |
| `GET /leave-request` | All for admin/manager, own for employee. JwtAuthGuard, all roles. |
| `GET /leave-balance/me` | Balances for current user's employee. 404 if no employee. JwtAuthGuard, all roles. |
| `PATCH /leave-request/cancel/:id` | Employee cancels own pending request. JwtAuthGuard, all roles. |

## Frontend (Completed)

- **Services**: leave-request.service.ts, leave-balance.service.ts, me.service.ts
- **Hook**: useLeaveRequests.ts
- **Component**: LeaveRequestForm.tsx (with "Complete your employee profile" when no employee)
- **Page**: _app.leave-requests.tsx

### Dashboard update

- `_app._index.tsx` now uses `getAllLeaveRequests()` and filters for pending count instead of `listLeaveRequestsByStatus('pending')`.
