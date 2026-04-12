# Organization branding (Coros web)

This document describes how **logo** and **primary brand color** are stored, loaded, and applied in the web app.

## Overview

- Each organization can have a **logo URL** (hosted via the API storage layer) and a **brand color** (6-digit hex, e.g. `#4F46E5`).
- The UI reads branding from a **Zustand store** and applies the color through **CSS variables** so Tailwind (`bg-brand`, `text-brand`, etc.) and shadcn-style **primary** colors stay in sync.
- **Organization ID** for reads always comes from the **JWT** (via `useAuthStore`), not from user-controlled route params on writes.

## Backend (API)

| Piece | Location |
|--------|----------|
| Persistence | `Organization.logoUrl`, `Organization.brandColor` on the `organization` table |
| Public read | `GET /v1/api/organizations/:id/branding` — no auth; returns `{ logoUrl?, brandColor? }` (wrapped in the usual Nest `{ data }` envelope) |
| Admin update | `PATCH /v1/api/organizations/:id/branding` — JWT required; roles `super_admin` \| `admin`; **multipart**: optional field `logo` (file), optional `brandColor` (string). Route `:id` must equal `organizationId` from the JWT or the API returns **403**. |
| File handling | `FileInterceptor('logo')`; file validated (type/size) then uploaded through **StorageService** (e.g. S3-compatible); returned URL stored in `logoUrl`. |

Shared type: `OrganizationBrandingDto` in `@org/shared-types`.

## Frontend state (`branding.store.ts`)

- **`useBrandingStore`** holds `logoUrl` and `brandColor`.
- **`hydrate(dto)`** — replaces branding from the API and applies the color theme (`applyBrandTheme`).
- **`setBranding(dto)`** — same as hydrate; used after a successful save on the branding settings page.
- **`reset()`** — clears store and removes inline theme overrides (`resetBrandTheme`).

**Session coupling:** `useAuthStore.subscribe` calls `reset()` when there is no valid session (no token or no `organizationId`). Logged-out users should not keep the previous org’s branding.

**Hook:** `useBranding()` returns `{ branding: { logoUrl, brandColor }, setBranding }` for components that need a stable object shape.

## When branding is loaded

1. **`_app.tsx` `clientLoader`** — After auth and setup checks, if `user.organizationId` and `accessToken` exist, it calls `getOrganizationBranding(organizationId)` and **`useBrandingStore.getState().hydrate(...)`**. This runs before the shell renders so the sidebar can show the org logo on first paint.
2. **Settings → Branding** — Saving calls `PATCH` with `FormData`, then `setBranding` with the response so the UI updates immediately without a full reload.

Reads use **`api.get`** (`/organizations/:id/branding`) so the request uses the same axios instance and response unwrapping as the rest of the app.

## HTTP client: multipart uploads

The shared axios client defaults to `Content-Type: application/json`. For **`FormData`** bodies, the request interceptor in `app/lib/api.ts` **removes** `Content-Type` so the browser sets `multipart/form-data` with a proper **boundary**. Without that, file fields can be serialized incorrectly and the server never receives the file.

## Theme / CSS (`brand-theme.ts`, `app.css`, `tailwind.config.ts`)

- **`--brand`** — space-separated **RGB channels** (e.g. `79 70 229`) for Tailwind opacity modifiers: `brand` is defined as `rgb(var(--brand) / <alpha-value>)` in `tailwind.config.ts`, so classes like `bg-brand/10` work.
- **Shadcn primary** — hex is converted to HSL components and written to `--primary`, `--ring`, `--accent-foreground`, and `--primary-foreground` (foreground text color depends on perceived luminance).
- **Defaults** — `:root` in `app.css` includes a fallback `--brand`; inline variables set from `hydrate` / `setBranding` override while the user is in a branded session.

## Where it appears in the UI

- **App shell** (`_app.tsx`): sidebar header uses `branding.logoUrl` with fallback to the default Coros asset; active nav items can use `bg-brand/10` / `text-brand`.
- **Auth layout** (`_auth.tsx`): same logo fallback pattern where branding is relevant.
- **Branding settings** (`_app.settings.branding.tsx`): file input + native color picker; save builds `FormData` with `brandColor` and optional `logo` file.

## Route layout note

`/settings` is a parent route with an `<Outlet />` for nested routes such as `/settings/branding`. The main settings tabs live at `/settings` only; child routes render inside the outlet (see `_app.settings.tsx`).
