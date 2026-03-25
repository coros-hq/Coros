# Employee invite flow and email process

This document describes how a new employee is created in Coros, how the welcome email is sent via Resend, and how the invitee sets their password. It reflects the implementation in `EmployeeService`, `InviteService`, `EmailService`, and the web app set-password route.

## Overview

1. An administrator creates an employee through the API (`POST` to the employees endpoint with organization context).
2. The API creates a `User` and `Employee` in a database transaction, including leave balances.
3. After the transaction commits, the API notifies organization admins (in-app notification) and, separately, creates a one-time invite token and sends a **welcome email** with a link to set a password.
4. The new hire opens the link, lands on the web app’s set-password page, and submits a password. The API validates the token and stores a bcrypt hash on the user; the token is marked **used** and cannot be reused.

The random password generated at user creation is **not** emailed; the employee is expected to use the invite link to choose their own password.

## Step 1: Create employee (API)

**Entry point:** `EmployeeService.createEmployee(organizationId, dto)` (`apps/api/src/employee/employee.service.ts`).

- Validates the department belongs to the organization.
- Rejects creation if a `User` with the same email already exists (no duplicate accounts; no invite email in that case).
- Inside a transaction:
  - Creates a `User` with the given email, a **random internal password** (hashed with bcrypt), role (defaults to employee), and `organizationId`.
  - Creates the `Employee` row linked to that user (name, department, manager, etc.).
  - Seeds default leave balances for the current year.

## Step 2: Post-commit: notifications and invite email

Still in `createEmployee`, **after** the transaction succeeds:

1. **Admin notifications** — For each user in the org with `ADMIN` or `SUPER_ADMIN`, a notification of type `EMPLOYEE_CREATED` is created (title/message/link to the new employee). Failures here are swallowed so they never fail the hire.

2. **Invite token + welcome email** — In a separate `try` block:
   - `InviteService.createToken(userId)` creates a row in `employee_invite_token`:
     - Opaque token: 32 random bytes, hex-encoded.
     - `expiresAt`: **7 days** from creation (`EmployeeInviteToken.expiresInHours()`).
   - `EmailService.sendWelcomeInvite(to, firstName, token)` sends the message described below.

If email sending throws (missing Resend key, Resend API error, etc.), the error is **logged as a warning** and the employee record still exists; the admin may need to resend or use another recovery path if you add one later.

## Step 3: Email delivery (Resend + React Email)

**Service:** `EmailService` (`apps/api/src/email/email.service.ts`).

- **Resend** is initialized with `RESEND_KEY` or `RESEND_API_KEY` (first match wins).
- **From:** `RESEND_FROM`, or default `Coros <onboarding@resend.dev>`.
- **App URL for links:** `COROS_WEB_URL`, default `http://localhost:5173`.

**Welcome invite:**

- **Template:** `WelcomeInvite` (`apps/api/src/email/templates/welcome-invite.tsx`), rendered to HTML with `@react-email/render`.
- **Subject:** `Welcome to Coros — set your password`.
- **Link:** `{COROS_WEB_URL}/set-password/{token}` — this must match the web route that hosts the set-password form.

Resend returns `{ data, error }` without throwing on API failure; `EmailService` uses `assertResendOk` so a failed send surfaces as an error to the caller (then caught and logged in `createEmployee`).

### Related: project invite email

`EmailService.sendProjectInvite` sends a different template (`project-invite`) when someone is added to a project (via `POST .../members` or when included in `memberIds` on project create); it links to `/projects/{projectId}` and does **not** use the password-invite token flow.

## Step 4: Set password (public API)

**Endpoint:** `POST /invite/set-password/:token` (public, no auth) — `InviteController` + `SetPasswordDto` (`apps/api/src/invite/`).

**`InviteService.setPassword(token, password)`:**

- Loads `EmployeeInviteToken` by `token` with `user` relation.
- Fails with **404** if missing (“Invalid or expired invite link”).
- Fails with **400** if `used` is true or `expiresAt` is in the past.
- Hashes the new password with bcrypt and updates the `User` row.
- Sets `used = true` on the token and saves.

## Step 5: Web app

- **Route:** `apps/web/app/routes/_auth.set-password.$token.tsx` — reads `token` from the URL.
- **Client:** `inviteService.setPassword(token, password)` → `POST /invite/set-password/:token` (`apps/web/app/services/invite.service.ts`).
- On success, the user is redirected to login with a success message.

Client-side validation includes matching passwords and minimum length (8 characters). The API enforces the same minimum via `SetPasswordDto` (`MinLength(8)`).

## Operational notes and failures

- **Resend does not throw on HTTP/API errors** — The SDK returns `{ data, error }`. `EmailService` checks `error` and throws so callers can log failures; `createEmployee` catches those and logs a warning without rolling back the hire.
- **Missing or invalid API key** — Welcome email fails; employee still exists. Check logs for `Welcome invite email not sent for …`.
- **Wrong or unverified `RESEND_FROM`** — Resend may reject the send or mail may not arrive as expected. Use an address on a domain you have verified in the Resend dashboard; avoid mixing test keys with production “from” domains in ways that confuse debugging.
- **`COROS_WEB_URL` mismatch** — The link in the email must point at the environment where the web app is served (including correct port for local dev). If the link 404s or hits the wrong app, fix the base URL in API config.

For broader emailing decisions (templates, env vars, phased roadmap), see [Emailing with Resend — Design Spec](./2026-03-23-emailing-resend-design.md).

## Configuration checklist

| Variable | Purpose |
|----------|---------|
| `RESEND_KEY` or `RESEND_API_KEY` | Resend API key (required for real sends) |
| `RESEND_FROM` | Verified sender address in Resend |
| `COROS_WEB_URL` | Base URL for invite links (production vs local) |

## Sequence diagram

```mermaid
sequenceDiagram
  participant Admin
  participant API as API (EmployeeService)
  participant DB as Database
  participant Invite as InviteService
  participant Mail as EmailService / Resend
  participant Hire as New hire (browser)

  Admin->>API: POST create employee
  API->>DB: Transaction: User + Employee + leave balances
  DB-->>API: OK
  API->>API: Notify org admins (best effort)
  API->>Invite: createToken(userId)
  Invite->>DB: Insert employee_invite_token
  Invite-->>API: token
  API->>Mail: sendWelcomeInvite(email, firstName, token)
  Mail-->>Hire: Email with /set-password/{token}
  Hire->>API: POST /invite/set-password/{token}
  API->>DB: Update user password; mark token used
  API-->>Hire: Success → redirect to login
```

## Data model (invite)

Table `employee_invite_token` (`EmployeeInviteToken`):

- `userId` — user who may set their password.
- `token` — unique string (64 hex chars from 32 bytes).
- `expiresAt` — default 7 days from creation.
- `used` — single-use gate after successful password set.
