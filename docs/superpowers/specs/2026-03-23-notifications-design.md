# Notifications Feature — Design Spec

**Date:** 2026-03-23  
**Status:** Draft

## Summary

Add an in-app notifications system for Coros: a backend module to create and store notifications, and a frontend bell icon with dropdown in the header. Notifications are triggered by domain events (leave requests, task assignments, project membership, new employees).

---

## Architecture

- **Backend:** New `Notification` entity, `NotificationService`, `NotificationController`. Other services (`LeaveRequestService`, `TaskService`, `ProjectService`, `EmployeeService`) inject `NotificationService` and create notifications on key actions. Notification creation is always wrapped in try/catch and fails silently.
- **Frontend:** `notificationService` API client, `NotificationBell` component (Popover), wired into `_app.tsx` header.
- **Scoping:** All notifications are per-user and per-organization. Routes use `@CurrentUser('id')` and `@CurrentUser('organizationId')` from JWT.
- **Delivery:** Polling (30s) for unread count; fetch list on dropdown open. No real-time/WebSocket.

---

## Step 1 — Backend: Notification Entity

**File:** `apps/api/src/notification/entities/notification.entity.ts`

- Extend `BaseEntity` (id, createdAt, updatedAt, deletedAt).
- Fields:
  - `userId` — uuid, FK to User (target recipient)
  - `organizationId` — uuid
  - `type` — enum `NotificationType` (from shared-types)
  - `title` — varchar
  - `message` — varchar
  - `read` — boolean, default false
  - `link` — varchar, nullable (frontend route for click navigation)

**File:** `libs/shared-types/src/lib/shared-types.ts`

Add:

```typescript
export enum NotificationType {
  LEAVE_REQUEST_SUBMITTED = 'leave_request_submitted',
  LEAVE_REQUEST_APPROVED = 'leave_request_approved',
  LEAVE_REQUEST_REJECTED = 'leave_request_rejected',
  TASK_ASSIGNED = 'task_assigned',
  PROJECT_MEMBER_ADDED = 'project_member_added',
  EMPLOYEE_CREATED = 'employee_created',
}
```

Ensure `shared-types` re-exports it via `libs/shared-types/src/index.ts` if needed.

---

## Step 2 — Backend: NotificationService

**File:** `apps/api/src/notification/notification.service.ts`

- Inject `@InjectRepository(Notification)`.
- Methods:
  - `create(dto: { userId, organizationId, type, title, message, link? })` — create and save. Used only by other services, never by controller.
  - `findAll(userId, organizationId)` — find notifications for user, order by `createdAt DESC`, `take(20)`.
  - `markAsRead(id, userId)` — find by id and userId, set `read: true`, save. Throw `NotFoundException` if not found or not owned by user.
  - `markAllAsRead(userId, organizationId)` — bulk update unread to `read: true`.
  - `getUnreadCount(userId, organizationId)` — return `{ count: number }`.

---

## Step 3 — Backend: NotificationController

**File:** `apps/api/src/notification/notification.controller.ts`

- Base path: `/notifications`
- All routes use `@UseGuards(JwtAuthGuard)`.
- **Route order matters:** `unread-count` and `read-all` must be declared before `:id` to avoid path conflicts.
- Routes:
  - `GET /notifications` — get all for current user
  - `GET /notifications/unread-count` — get unread count
  - `PATCH /notifications/read-all` — mark all as read
  - `PATCH /notifications/:id/read` — mark single as read
- Parameters: `@CurrentUser('id') userId`, `@CurrentUser('organizationId') organizationId`.

---

## Step 4 — Backend: NotificationModule

**File:** `apps/api/src/notification/notification.module.ts`

- `TypeOrmModule.forFeature([Notification])`
- Declare `NotificationService`, `NotificationController`
- Export `NotificationService`

**File:** `apps/api/src/app/app.module.ts`

- Add `Notification` to `entities` array.
- Add `NotificationModule` to `imports`.

---

## Step 5 — Wire Notifications Into Existing Services

### LeaveRequestService

- Import `NotificationModule` into `LeaveRequestModule`.
- Inject `NotificationService` and `User` repository (or `Employee` to derive User).
- **create()** — when status is PENDING (employee submitted):
  - Fetch employee with relations to get `firstName`, `lastName`, `organizationId`.
  - Query `User` where `organizationId` and `role IN (ADMIN, MANAGER, SUPER_ADMIN)`.
  - For each user, call `notificationService.create()` with `type: LEAVE_REQUEST_SUBMITTED`, `title: 'New leave request'`, `message: '${employee.firstName} ${employee.lastName} submitted a ${type} leave request'`, `link: '/leave-requests'`.
- **approve()** — after successful approval:
  - Load leave request with `employee.user` relation.
  - Notify `employee.userId` with `LEAVE_REQUEST_APPROVED`, `message: 'Your ${type} leave request has been approved'`, `link: '/leave-requests'`.
- **reject()** — same pattern, `LEAVE_REQUEST_REJECTED`.

All notification logic wrapped in try/catch; never throw.

### TaskService

- Import `NotificationModule` into `TaskModule`.
- Inject `NotificationService`.
- **update()** — before applying `dto.assigneeId`, capture `previousAssigneeId = task.assigneeId`. After save, if `dto.assigneeId !== undefined` and `dto.assigneeId !== previousAssigneeId` and `dto.assigneeId !== null`:
  - Load assignee employee with `user` relation.
  - Notify `assignee.userId` with `TASK_ASSIGNED`, `title: 'Task assigned to you'`, `message: '${task.name} in ${project.name}'`, `link: '/projects/${task.projectId}/tasks'`.
  - Load project for name. Wrap in try/catch.

### ProjectService

- Import `NotificationModule` into `ProjectModule`.
- Inject `NotificationService`.
- **addMember()** — after saving member:
  - Employee is already loaded; ensure `user` relation or fetch it.
  - Notify `employee.userId` with `PROJECT_MEMBER_ADDED`, `title: 'Added to a project'`, `message: 'You have been added to ${project.name}'`, `link: '/projects/${project.id}/tasks'`.
  - Wrap in try/catch.

### EmployeeService

- Import `NotificationModule` into `EmployeeModule`.
- Inject `NotificationService` and `User` repository.
- **createEmployee()** — after transaction completes successfully:
  - Query `User` where `organizationId` and `role IN (ADMIN, SUPER_ADMIN)`.
  - For each admin, create notification: `EMPLOYEE_CREATED`, `title: 'New employee joined'`, `message: '${firstName} ${lastName} has joined the organization'`, `link: '/employees/${savedEmployee.id}'`.
  - Wrap in try/catch.

---

## Step 6 — Frontend: Notification Service

**File:** `apps/web/app/services/notification.service.ts`

**Important:** The existing `api` client (from `~/lib/api`) unwraps responses via interceptor. `api.get<T>()` returns `T` directly, not `{ data: T }`. Do not use `data.data`.

```typescript
import { api } from '~/lib/api';

export interface ApiNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string | null;
  createdAt: string;
}

export const notificationService = {
  getAll: async (): Promise<ApiNotification[]> => {
    return api.get<ApiNotification[]>('/notifications');
  },
  getUnreadCount: async (): Promise<number> => {
    const data = await api.get<{ count: number }>('/notifications/unread-count');
    return data.count;
  },
  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },
  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },
};
```

---

## Step 7 — Frontend: NotificationBell Component

**File:** `apps/web/app/components/notifications/NotificationBell.tsx`

- Use `Popover` from shadcn (not DropdownMenu).
- State: `open`, `notifications`, `unreadCount`, `isLoading`.
- Poll `getUnreadCount` every 30 seconds; clean up interval on unmount.
- On `onOpenChange(true)`, fetch `getAll()` and set notifications.
- `handleNotificationClick`: if unread, call `markAsRead`, update local state, decrement count; if `link`, `navigate(link)`; close popover.
- `handleMarkAllAsRead`: call API, set all to read, count to 0.
- `timeAgo(date)` helper: "just now", "Xm ago", "Xh ago", "Xd ago".
- `NotificationIcon({ type })`: map type to lucide icon (CalendarDays, CheckCircle2, XCircle, CheckSquare, FolderKanban, Users, Bell fallback).
- UI: Bell button with badge (max "9+"), header with "Mark all read" when unread > 0, list with skeleton loading, empty state, clickable rows. Use `cn()` for conditional classes.

Icons: `Bell`, `CalendarDays`, `CheckCircle2`, `XCircle`, `CheckSquare`, `FolderKanban`, `Users` from lucide-react.

---

## Step 8 — Wire Into Layout

**File:** `apps/web/app/routes/_app.tsx`

- Import `NotificationBell`.
- Add `<NotificationBell />` in header after `<GlobalSearch />`:

```tsx
<header className="...">
  <SidebarTrigger className="-ml-1" />
  <div className="flex flex-1 items-center gap-3" id="page-header" />
  <GlobalSearch />
  <NotificationBell />
</header>
```

---

## Rules Summary

| Rule | Notes |
|------|-------|
| Notification creation | Always try/catch, never throw |
| Controller route order | `unread-count`, `read-all` before `:id` |
| Scoping | userId + organizationId from JWT on all routes |
| Polling cleanup | Clear interval on unmount |
| Icons | lucide-react: Bell, CalendarDays, CheckCircle2, XCircle, CheckSquare, FolderKanban, Users |
| Component | Popover, Skeleton, cn() for classes |
| Navigation | useNavigate, not useEffect for navigation |

---

## API Response Shape

Backend should return JSON that NestJS serializes. For list endpoints, return the array directly (or object with `data`; the frontend interceptor unwraps `data` if present). Confirm backend response format matches what `unwrapApiResponse` expects: `{ data: T }` for wrapped, or raw `T`.

---

## Open Questions / TBD

- **Leave request create:** When admin/manager creates a request (auto-approved), spec does not require notifying the employee. If product wants that, add `LEAVE_REQUEST_APPROVED` for employee in that path.
- **Migration:** With `synchronize: true` in development, TypeORM will create the table. For production, add a proper migration when turning off synchronize.
