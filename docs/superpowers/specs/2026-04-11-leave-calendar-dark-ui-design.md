# Leave calendar — Linear/Notion-inspired dark UI

**Date:** 2026-04-11  
**Scope:** Visual-only redesign of the leave-requests **calendar mode** (`LeaveCalendar` + calendar toolbar row + surrounding calendar-mode surfaces). **List/table mode and shared sheets/forms are unchanged** unless noted.

**Assumption:** Dark treatment applies to the **whole calendar-mode content** (balance summary cards + filter row + calendar), not an isolated dark island on the lavender shell.

---

## Approaches considered

### A — Scoped CSS + minimal TSX (recommended)

**What:** Keep `react-big-calendar` and all existing props, state, handlers, and data flow. Replace leave-type colors with **request status** styling in `CustomEventComponent`. Restyle `CustomToolbar` with plain `<button>` or existing `Button` + Tailwind. Add a `@layer components` block in `app.css` targeting **`.leave-calendar`** descendants (`.rbc-month-view`, `.rbc-header`, `.rbc-day-bg`, `.rbc-off-range-bg`, `.rbc-today`, `.rbc-date-cell`, `.rbc-event`, popup) using `@apply` where practical so the default `react-big-calendar.css` light theme is overridden inside the calendar only.

**Pros:** Matches “visual layer only”; smallest logic diff; predictable with current architecture.  
**Cons:** Requires maintaining a focused set of `.rbc-*` overrides; must verify popup/overlay (`+N more`) matches dark tokens.

### B — Heavy `components.*` customization in react-big-calendar

**What:** Replace month row/header/day wrappers with custom React components from the library’s `components` API.

**Pros:** Maximum control per cell without relying on global class names.  
**Cons:** Larger surface area, easier to break upgrades; unnecessary for this spec.

### C — Replace the calendar library

**Not recommended** — violates “no new dependencies” and “keep existing logic.”

---

## Design

### 1. Route layout (`_app.leave-requests.tsx`, calendar branch only)

When `viewMode === 'calendar'` and the main content is shown (not only the empty state):

- Wrap **balance grid + toolbar row + `LeaveCalendar`** in a container with **`bg-zinc-950`** and comfortable vertical rhythm (e.g. `gap-6` or existing gap).
- **Balance cards:** Dark “layered” surfaces — e.g. `rounded-lg border border-zinc-800 bg-zinc-900` (aligned with card `#111111` / border `#262626` intent). Muted labels `text-zinc-500`, values `text-zinc-100`, progress track `bg-zinc-800` with fill `bg-violet-600` (or keep primary if it reads on dark — prefer violet to match CTA).
- **Filter row:** `SelectTrigger` classes: `h-9 rounded-lg border-zinc-800 bg-zinc-900 text-sm text-zinc-300` + `hover:border-zinc-700` (use `className` + `cn` with shadcn trigger).
- **Request leave:** `bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg h-9 px-4`; icon **`CalendarPlus`** from `lucide-react` at `size-4` — **remove `CalendarDays`** for this button.
- Import `CalendarPlus` alongside existing icons; do not add packages.

### 2. `LeaveCalendar.tsx` wrapper and toolbar

- Outer structure: page-level feel inside the route — avoid double-padding conflicts; inner calendar box:
  - **`h-[600px]`** unchanged.
  - Container: **`rounded-xl border border-zinc-800 bg-zinc-900 p-4`** (drop generic `bg-card` if it fights dark).
- **`CustomToolbar`:**
  - **Month title:** `text-base font-semibold tracking-tight text-zinc-100` (center).
  - **Prev/Next:** Native `<button type="button">` or `Button` with `variant="ghost"` / class override: `size-7 rounded-md border-0 bg-transparent hover:bg-zinc-800/80` (user asked `bg-zinc-800/0` — use transparent default), `text-zinc-400 hover:text-zinc-100`, `transition-colors`.
  - Icons: **`ChevronLeft` / `ChevronRight`**, `h-4 w-4`.
  - Spacer div sizing aligned to `size-7` for layout balance.
- **Do not** use `toolbar` default buttons from the library (already custom).

### 3. Event pills (`CustomEventComponent`)

- **Color model:** Map **`event.resource.status`** (from `ApiLeaveRequest`) to Tailwind utility sets — **not** leave type:
  - **approved:** `bg-emerald-500/10 border border-emerald-500/20 text-emerald-400`
  - **pending:** `bg-amber-500/10 border border-amber-500/20 text-amber-400`
  - **rejected:** `bg-red-500/10 border border-red-500/20 text-red-400`
  - **cancelled:** `bg-zinc-500/10 border border-zinc-500/20 text-zinc-400` (muted neutral; not listed in original brief but required by domain)
- **Layout:** `flex items-center gap-1.5`, bar `rounded-md py-0.5 px-2`, `text-[11px]`, `overflow-hidden`.
- **Avatar initials:** `flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-medium text-zinc-200` (not raw initials text without bubble).
- **Name:** `text-xs font-medium truncate` (or `min-w-0` on flex child).
- Remove **`LEAVE_TYPE_COLORS`** / `getEventColor` by type; replace with **`getStatusEventClasses(status: string)`** (normalize lowercase, default to cancelled-style or pending — **default `pending`** if unknown).

### 4. `app.css` — `.leave-calendar` overrides

Scope all rules under **`.leave-calendar`** to avoid breaking other potential `rbc` usages.

Target classes (from react-big-calendar):

- **Month view:** `.rbc-month-view` — border `border-zinc-800/60` or `border-zinc-800`, background transparent or match `bg-zinc-900` parent; remove default `#ddd`.
- **Weekday headers:** `.rbc-header` — `text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500`, border-bottom `border-zinc-800/60`, no bold 90% default if overridden.
- **Off-range background:** `.rbc-off-range-bg` — `bg-zinc-950/60` (not gray `#e6e6e6`).
- **Off-range label color:** `.rbc-off-range` — `text-zinc-600` or similar.
- **Day backgrounds:** `.rbc-day-bg` — borders `border-zinc-800/60` between cells (left borders on `+ .rbc-day-bg`).
- **Today (background row):** `.rbc-day-bg.rbc-today` — **no heavy fill**; use **`ring-1 ring-inset ring-violet-500/40`** (or `indigo`) **+** optional `bg-transparent` / very subtle `bg-violet-500/5` if needed for visibility.
- **Date number row:** `.rbc-date-cell` — `text-sm text-zinc-400`; **`.rbc-date-cell.rbc-now`** — `text-violet-400 font-semibold` (and ensure link inherits: `a { @apply ... }`).
- **Day cell hover:** `.rbc-day-bg` is the interactive background — use **`.rbc-day-bg:hover`** with `background-color: rgb(39 39 42 / 0.3)` (`bg-zinc-800/30`), `transition-colors duration-100`, `cursor-pointer`. If hover does not trigger (library quirk), apply hover on the row container that wraps backgrounds — verify in browser; prefer the shallowest selector that works.
- **Events:** `.leave-calendar .rbc-event` — `background: transparent`, `border: none`, `box-shadow: none`, `padding: 0`, so the inner custom pill controls look. Remove default blue `#3174ad`.
- **Show more / popup:** `.rbc-show-more`, `.rbc-overlay` — dark surfaces (`bg-zinc-900`, `border-zinc-800`, text `text-zinc-300`) so popovers match.

Use `@apply` only where Tailwind utilities apply cleanly; otherwise use arbitrary values or raw CSS aligned with tokens.

### 5. Constraints (unchanged from brief)

- **No** new npm dependencies.
- **No** changes to props, types, hooks, or API calls — **except** replacing type-based coloring with status-based styling inside the event component (data already on `resource`).
- **Shadcn + Tailwind only** for React; **global scoped `.rbc-*` overrides** are allowed as the standard way to theme react-big-calendar.

### 6. Testing / QA

- Manual: calendar mode — month nav, today styling, off-month dimming, hover on cells, event pills for each status, cancelled/rejected, popup “+N more” on busy days.
- Regression: list mode, empty state, sheet open/create leave, admin approve/reject flows untouched.

---

## Self-review

- **Placeholders:** None; cancelled status explicitly specified.
- **Consistency:** Route + component + CSS sections align; status-based pills replace type-based colors per product request.
- **Scope:** Calendar-mode visuals only; list mode out of scope.
- **Ambiguity:** “Page bg” implemented as calendar-mode wrapper `bg-zinc-950`; inner card `bg-zinc-900` on `LeaveCalendar` container.
