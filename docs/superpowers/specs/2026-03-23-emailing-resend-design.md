# Emailing with Resend — Design Spec (MVP)

**Date:** 2026-03-23  
**Status:** Implemented

## Summary

MVP emailing using Resend for Coros: welcome invite email (token-based set-password flow) for new employees, and project invite email when adding someone to a project. Phased approach; future phases include leave request status, task assignment, etc.

---

## Architecture

- **EmailModule:** `EmailService` wraps Resend, renders React Email templates.
- **InviteModule:** `InviteService` creates/validates tokens; `InviteController` exposes public `POST /invite/set-password/:token`.
- **Employee create:** After creating user/employee, create invite token, send welcome email with set-password link.
- **Project add member:** After adding member, send project invite email (in addition to in-app notification).
- **Set-password flow:** Link opens `/set-password/:token`; user sets password, redirect to login.

---

## Dependencies

- `resend` — Resend SDK
- `@react-email/components` — Email template components
- `@react-email/render` — Render React to HTML
- `react` — For React Email (API package)

---

## Env Vars

| Var | Description |
|-----|-------------|
| `RESEND_KEY` | Resend API key (existing) |
| `RESEND_FROM` | Sender e.g. `Coros <onboarding@resend.dev>` |
| `COROS_WEB_URL` | Web app base URL for links (e.g. `http://localhost:4200`) |

---

## Backend

### EmployeeInviteToken

- `userId`, `token` (unique), `expiresAt`, `used`
- Default expiry: 7 days
- On set-password: validate token, hash password, update user, mark token used

### InviteModule

- `InviteService.createToken(userId)` → `{ token, expiresAt }`
- `InviteService.setPassword(token, password)` — validates, updates user, invalidates token
- `InviteController`: `POST /invite/set-password/:token` (public)

### EmailModule

- `EmailService.sendWelcomeInvite(to, firstName, token)`
- `EmailService.sendProjectInvite(to, projectName, projectId)`
- Templates: `WelcomeInvite`, `ProjectInvite` (React Email)

### Wiring

- **EmployeeService.createEmployee:** After transaction, create token, send welcome email (try/catch, non-blocking)
- **ProjectService.addMember:** After saving member, send project invite (try/catch, non-blocking)

---

## Frontend

- Route: `/set-password/:token` (`_auth.set-password.$token.tsx`)
- Form: password + confirm password
- On success: redirect to `/login` with message
- Uses `inviteService.setPassword(token, password)` → `POST /invite/set-password/:token`

---

## Future Phases

- Leave request submitted/approved/rejected emails
- Task assignment email
- Contract-related emails
- User email preferences (opt-out)
