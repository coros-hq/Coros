# Leave calendar — Linear/Notion-inspired dark UI

**Date:** 2026-04-11  
**Scope:** Calendar mode on leave requests: `LeaveCalendar`, calendar toolbar row, and calendar-mode balance cards. List/table mode and shared sheets/forms stay on the existing light tokens unless shared components are reused.

**Chosen approach: C — Replace `react-big-calendar`**

The bundled month view was replaced with a **custom month grid** built from **React + `date-fns`** only (no new npm dependencies). `react-big-calendar` and its global CSS import were removed.

**Behavior preserved:** Same `LeaveCalendarProps`; clicking a leave pill opens `LeaveRequestDetailSheet` with the same handlers. Each calendar day lists requests whose date range overlaps that day (inclusive). Overflow shows the first three pills plus “+N more” in a `Popover` with the rest.

**Assumption:** Dark treatment applies to the **whole calendar-mode stack** (balances + toolbar + calendar) via `bg-zinc-950` wrapper on the route.

---

## Design tokens (implementation)

- **Route (calendar mode):** Wrapper `-mx-6 rounded-xl bg-zinc-950 px-6 py-6`; balance cards `border-zinc-800 bg-zinc-900`; filters `h-9 rounded-lg border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700`; **Request leave** `bg-violet-600 hover:bg-violet-500 h-9 px-4` with **`CalendarPlus`** `size-4`.
- **LeaveCalendar:** Outer `h-[600px] rounded-xl border-zinc-800 bg-zinc-900 p-4`; toolbar month title `text-base font-semibold text-zinc-100`; prev/next `size-7` ghost-style; weekday row uppercase `text-[11px] tracking-[0.08em] text-zinc-500`; grid `divide-zinc-800/60`; off-month cells `bg-zinc-950/60`; today `ring-violet-500/40` + `text-violet-400` on day number; cell `hover:bg-zinc-800/30 cursor-pointer`.
- **Pills:** Status-based emerald / amber / red / zinc (cancelled); initials in 18×18 `bg-zinc-700` bubble; `text-[11px]` / `text-xs` name.

---

## Self-review

- **Scope:** Calendar-only surfaces; list mode balances unchanged (light cards).
- **Dependencies:** `react-big-calendar` removed from `apps/web` — lockfile updated via `pnpm install`.
