# Shadcn Design System Cleanup — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace every hardcoded color override with shadcn semantic tokens, install the shadcn Sidebar in the app layout, fix Sheet animation patterns, and clean up EmployeeForm / DataTable.

**Architecture:** Five sequential tasks — sidebar first (biggest structural change), then Sheet fixes, then EmployeeForm, then DataTable, then a mechanical token sweep over all routes. Zero business logic changes in any task.

**Tech Stack:** React 19, React Router 7, shadcn/ui (base-nova, `@base-ui/react`), Tailwind CSS, Lucide React.

---

## Task 1: Replace sidebar in `_app.tsx` with shadcn Sidebar

**Files:**
- Modify: `apps/web/app/routes/_app.tsx`

**Context:**
- `apps/web/app/components/ui/sidebar.tsx` is already installed — do NOT run `pnpm dlx shadcn add sidebar` again.
- The sidebar exports: `SidebarProvider`, `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarTrigger`, `SidebarInset`.
- The current layout uses a custom `<aside>` with hardcoded `bg-white border-zinc-200 text-zinc-*` and a manual mobile overlay.
- `SidebarProvider` wraps the whole layout and provides collapse state + keyboard shortcut (`Ctrl/Cmd+B`).
- `SidebarInset` replaces the main content `<div>` — it handles the left offset automatically.
- Active route is detected with `useLocation` from `react-router` — compare `location.pathname` to `item.href`. For `/` use exact match, for others use `startsWith`.
- Keep all `NAV_GROUPS` data, `clientLoader`, `handleLogout`, and icon components exactly as-is.
- The `id="page-header"` div in the old `<header>` must be preserved — routes portal their page titles into it.

**Step 1: Rewrite `_app.tsx` layout**

Replace the entire `AppLayout` function return (lines 93–206) with:

```tsx
import { useLocation } from 'react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '~/components/ui/sidebar';

export default function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    try {
      await authService.logout();
    } finally {
      clearAuth();
      navigate('/login');
    }
  }

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2.5 px-1 py-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
              <CorosIcon className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-semibold leading-none tracking-tight text-sidebar-foreground">
                Coros
              </p>
              {user ? (
                <p className="mt-0.5 text-[9px] font-medium uppercase tracking-widest text-sidebar-foreground/60">
                  {user.role}
                </p>
              ) : null}
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {NAV_GROUPS.map((group, gi) => {
            if (group.roles && user && !group.roles.includes(user.role)) return null;
            return (
              <SidebarGroup key={gi}>
                {group.label ? (
                  <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                ) : null}
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive =
                      item.href === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(item.href);
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.label}
                        >
                          <a href={item.href}>
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            );
          })}
        </SidebarContent>

        {user ? (
          <SidebarFooter>
            <div className="flex items-center gap-2.5 px-1 py-1 group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-7 w-7 shrink-0 ring-2 ring-primary ring-offset-2 ring-offset-sidebar">
                <AvatarFallback className="bg-muted text-[10px] font-semibold text-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-xs font-medium text-sidebar-foreground">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-[9px] text-sidebar-foreground/60">{user.email}</p>
              </div>
              <Button
                aria-label="Sign out"
                className="h-7 w-7 shrink-0 group-data-[collapsible=icon]:hidden"
                onClick={() => void handleLogout()}
                size="icon"
                type="button"
                variant="ghost"
              >
                <IconLogout className="h-3.5 w-3.5" />
              </Button>
            </div>
          </SidebarFooter>
        ) : null}
      </Sidebar>

      <SidebarInset>
        <header className="flex min-h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-5 py-2">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center gap-3" id="page-header" />
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto bg-background text-sm text-foreground">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

**Note:** `SidebarMenuButton` with `asChild` needs an `<a>` not `<NavLink>` to avoid double active-link logic. We detect active with `useLocation` manually.

**Step 2: Update imports — remove unused, add new**

Remove from imports:
- `useState` (no longer needed for `mobileOpen`)
- All `NavLink` usage (replaced by `<a>` + `useLocation`)

Add to imports:
- `useLocation` from `'react-router'`
- All sidebar components from `'~/components/ui/sidebar'`

**Step 3: Verify types compile**

Run: `pnpm nx run @org/web:typecheck`
Expected: Only pre-existing errors (date-picker `asChild`, register form) — no new errors from sidebar changes.

**Step 4: Visual check**

Start dev server if not running: `pnpm nx run @org/web:dev:development`
Navigate to `http://localhost:5173` — sidebar should render with purple brand icon, nav groups, user footer, and `Ctrl+B` should collapse/expand.

**Step 5: Commit**

```bash
git add apps/web/app/routes/_app.tsx
git commit -m "feat: replace custom sidebar with shadcn Sidebar component"
```

---

## Task 2: Fix Sheet always-mounted pattern

**Files:**
- Modify: `apps/web/app/routes/_app.employees.tsx` (lines ~403–430)
- Modify: `apps/web/app/routes/_app._index.tsx` (`EmployeeSheet` component, lines ~456–536)

**Context:**
- Pattern `{sheetOpen && <Sheet open>}` destroys and remounts the Sheet on close, killing the exit animation.
- The fix: always render `<Sheet>`, control visibility with the `open` prop only.
- Do not change state management, `handleSheetClose`, `editingEmployee`, or the form inside the Sheet.

**Step 1: Fix `_app.employees.tsx`**

Find (around line 403):
```tsx
{sheetOpen && (
  <Sheet open onOpenChange={handleSheetClose}>
    <SheetContent className="sm:max-w-md">
      ...
    </SheetContent>
  </Sheet>
)}
```

Replace with:
```tsx
<Sheet open={sheetOpen} onOpenChange={handleSheetClose}>
  <SheetContent className="sm:max-w-md">
    <SheetHeader>
      <SheetTitle>
        {editingEmployee ? 'Edit employee' : 'Add employee'}
      </SheetTitle>
    </SheetHeader>
    <div className="mt-4">
      <EmployeeForm
        mode={editingEmployee ? 'edit' : 'create'}
        employee={editingEmployee ?? undefined}
        departments={departments}
        positions={positions}
        employees={employees}
        onSubmit={editingEmployee ? handleUpdateSubmit : handleCreateSubmit}
        onCancel={() => handleSheetClose(false)}
      />
    </div>
  </SheetContent>
</Sheet>
```

**Step 2: Fix `_app._index.tsx` `EmployeeSheet`**

The `EmployeeSheet` function (around line 456) already has `open={open}` passed as a prop, so it's correctly controlled. Just verify the Sheet inside it is `<Sheet open={open} onOpenChange={...}>` (not wrapped in a conditional). It should already be fine — no change needed here.

**Step 3: Commit**

```bash
git add apps/web/app/routes/_app.employees.tsx
git commit -m "fix: always-mount Sheet to restore slide animation"
```

---

## Task 3: Clean up EmployeeForm

**Files:**
- Modify: `apps/web/app/components/employees/EmployeeForm.tsx`
- Modify: `apps/web/app/components/ui/date-picker.tsx`

**Context:**
- `EmployeeForm` has 5 class-variable strings at lines 164–174: `inputClass`, `labelClass`, `selectTriggerClass`, `selectContentClass`, `selectItemClass`. Delete all of them.
- Remove every `className={inputClass}`, `className={labelClass}`, etc. from components.
- Field wrappers: change `space-y-1.5` → `space-y-2`.
- Submit button: remove `className="bg-violet-600 text-white hover:bg-violet-500 text-sm font-medium"` — default Button is primary.
- Cancel button: remove `className="border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"` — `variant="outline"` bare is correct.
- `FieldError`: change `text-red-400` → `text-destructive`.
- Form error box: `border-red-500/20 bg-red-500/10 text-red-400` → `border-destructive/20 bg-destructive/10 text-destructive`.
- Manager optional label `text-zinc-500` → `text-muted-foreground`.
- `date-picker.tsx` Button className: remove `border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50` and `text-zinc-500` placeholder color.

**Step 1: Delete class variables and clean EmployeeForm**

In `EmployeeForm.tsx`, delete lines 164–174 (the 5 class variables).

Then for every component in the form:
- `Input`: remove `className={inputClass}` entirely
- `Label`: remove `className={labelClass}` entirely
- `SelectTrigger`: remove `className={selectTriggerClass}` entirely
- `SelectContent`: remove `className={selectContentClass}` entirely
- `SelectItem`: remove `className={selectItemClass}` entirely
- All `space-y-1.5` → `space-y-2`
- Submit button → `<Button type="submit" disabled={isSubmitting}>`
- Cancel button → `<Button type="button" variant="outline" onClick={onCancel}>`
- `FieldError` → `<p className="mt-1 text-xs text-destructive">`
- Form error div → `className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"`
- Manager optional span → `className="normal-case tracking-normal text-muted-foreground"`

**Step 2: Clean DatePicker**

In `apps/web/app/components/ui/date-picker.tsx`, replace the Button className:

```tsx
// Before
className={cn(
  'w-full justify-start text-left font-normal border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50',
  !selected && 'text-zinc-500',
  className
)}

// After
className={cn(
  'w-full justify-start text-left font-normal',
  !selected && 'text-muted-foreground',
  className
)}
```

**Step 3: Verify no regressions**

Run typecheck: `pnpm nx run @org/web:typecheck`
Open the "Add employee" sheet in the browser. Verify fields render with correct borders, placeholder styles, and the primary button is purple from the token.

**Step 4: Commit**

```bash
git add apps/web/app/components/employees/EmployeeForm.tsx apps/web/app/components/ui/date-picker.tsx
git commit -m "fix: remove custom class overrides from EmployeeForm and DatePicker"
```

---

## Task 4: Fix DataTable DropdownMenuTrigger

**Files:**
- Modify: `apps/web/app/components/data-table/DataTable.tsx`

**Context:**
- Base UI's `DropdownMenu.Trigger` uses a `render` prop for composition. The current code passes `render={<Button>}` which is correct for Base UI but the Button ends up without its own click handling.
- Check how `DropdownMenuTrigger` is implemented in `~/components/ui/dropdown-menu.tsx` — if it's a Base UI wrapper, the `render` prop is the right pattern. If it extends Radix, use `asChild`.
- Also fix remaining `bg-white`, `text-black` in DataTable.

**Step 1: Check DropdownMenuTrigger implementation**

Read `apps/web/app/components/ui/dropdown-menu.tsx` to see if it uses Base UI or Radix.

**Step 2a: If Base UI** — Keep `render` prop but clean up Button className:

```tsx
<DropdownMenuTrigger
  render={
    <Button variant="outline" className="h-10 gap-1.5 px-3 text-sm font-medium">
      Columns
      <ChevronDown className="h-4 w-4 opacity-70" />
    </Button>
  }
/>
```

**Step 2b: If Radix** — Switch to `asChild`:

```tsx
<DropdownMenuTrigger asChild>
  <Button variant="outline" className="h-10 gap-1.5 px-3 text-sm font-medium">
    Columns
    <ChevronDown className="h-4 w-4 opacity-70" />
  </Button>
</DropdownMenuTrigger>
```

**Step 3: Fix remaining hardcoded tokens in DataTable**

- Table container: `bg-white` → `bg-background`
- Empty state cell: `text-black` → `text-foreground`
- Header row: `bg-purple-lighter/30` is fine (design token), keep it
- Skeleton rows and body cells: already use `text-foreground` — verify and keep

**Step 4: Commit**

```bash
git add apps/web/app/components/data-table/DataTable.tsx
git commit -m "fix: clean DataTable DropdownMenuTrigger and token overrides"
```

---

## Task 5: Token sweep — all remaining route files and StatCard

**Files to modify:**
- `apps/web/app/routes/_app.tsx` (any remaining after Task 1)
- `apps/web/app/routes/_app._index.tsx`
- `apps/web/app/routes/_app.employees.tsx`
- `apps/web/app/routes/_app.departments.tsx`
- `apps/web/app/routes/_app.leave-requests.tsx`
- `apps/web/app/routes/_app.projects.tsx`
- `apps/web/app/routes/_app.projects.$id.tsx`
- `apps/web/app/routes/_app.projects.$id.tasks.tsx`
- `apps/web/app/routes/_app.documents.tsx`
- `apps/web/app/routes/_app.settings.tsx`
- `apps/web/app/routes/_app.settings.organization.tsx`
- `apps/web/app/routes/_app.settings.members.tsx`
- `apps/web/app/routes/_app.employees.$id.tsx`
- `apps/web/app/routes/_auth.login.tsx`
- `apps/web/app/routes/_auth.register.tsx`
- `apps/web/app/routes/setup.tsx`
- `apps/web/app/components/StatCard.tsx`

**Token replacement table (apply mechanically):**

| Find | Replace with |
|------|-------------|
| `bg-white` | `bg-background` |
| `bg-zinc-50` | `bg-accent` |
| `bg-zinc-100` | `bg-muted` |
| `text-zinc-900` | `text-foreground` |
| `text-zinc-800` | `text-foreground` |
| `text-zinc-700` | `text-foreground` |
| `text-zinc-600` | `text-muted-foreground` |
| `text-zinc-500` | `text-muted-foreground` |
| `text-zinc-400` | `text-muted-foreground` |
| `text-black` | `text-foreground` |
| `border-zinc-200` | `border-border` |
| `border-zinc-300` | `border-border` |
| `bg-violet-600` | `bg-primary` |
| `bg-violet-500` | `bg-primary/90` |
| `text-violet-` | `text-primary` |
| `ring-violet-500` | `ring-primary` |
| `focus-visible:ring-0` | *(delete entire class)* |
| `focus:ring-0` | *(delete entire class)* |
| `bg-red-50` | `bg-destructive/10` |
| `border-red-200` | `border-destructive/25` |
| `text-red-700` | `text-destructive` |
| `bg-emerald-50` | `bg-success-muted` |
| `text-emerald-700` | `text-success` |
| `border-emerald-500/30` | `border-success/30` |

**Step 1: Fix `_app._index.tsx`**

This file has ~90 hardcoded zinc/violet hits. Apply the table above. Pay special attention to:
- Local `StatusBadge` — use `bg-success-muted text-success border-success/30`, `bg-warning-muted text-warning border-warning/30`
- Local `StatCard` in `_app._index.tsx` (not the shared `StatCard.tsx`) — `border-zinc-200 bg-white` → `border-border bg-card`
- Sheet (`EmployeeSheet`) — `border-zinc-200 bg-white text-zinc-900` → `border-border bg-background text-foreground`

**Step 2: Fix `setup.tsx`**

~60 hits. Apply table. The step form headings, inputs, select overrides, and button should all tokenize cleanly. The color swatches (`style={{ backgroundColor: c.value }}`) are intentional inline styles — leave them alone.

**Step 3: Fix `_auth.login.tsx` and `_auth.register.tsx`**

~10–15 hits each. Apply table.

**Step 4: Fix all `_app.*` route pages**

Each of: `_app.departments.tsx`, `_app.leave-requests.tsx`, `_app.projects.tsx`, `_app.projects.$id.tsx`, `_app.projects.$id.tasks.tsx`, `_app.documents.tsx`, `_app.settings.tsx`, `_app.settings.organization.tsx`, `_app.settings.members.tsx`, `_app.employees.$id.tsx`.
Apply the token table to each.

**Step 5: Fix `StatCard.tsx`**

```tsx
// Before
<div className="rounded-lg border border-purple-light bg-white px-4 py-3">
  <p className="text-[11px] font-semibold uppercase leading-tight tracking-wide text-black">{label}</p>
  <p className="mt-1.5 text-3xl font-semibold leading-none tracking-tight text-black">{value}</p>
  {sub ? <p className="mt-1.5 text-xs font-normal leading-tight text-black">{sub}</p> : null}
</div>

// After
<div className="rounded-lg border border-border bg-card px-4 py-3">
  <p className="text-[11px] font-semibold uppercase leading-tight tracking-wide text-foreground">{label}</p>
  <p className="mt-1.5 text-2xl font-semibold leading-none tracking-tight text-foreground">{value}</p>
  {sub ? <p className="mt-1.5 text-xs font-normal leading-tight text-muted-foreground">{sub}</p> : null}
</div>
```

**Step 6: Verify zero remaining hardcoded overrides**

Run this search to confirm nothing was missed:
```bash
rg "bg-white|text-zinc-|border-zinc-|bg-zinc-|text-black|bg-violet-|focus-visible:ring-0|focus:ring-0" apps/web/app/routes apps/web/app/components --glob "*.tsx" -l
```
Expected: zero matches (or only intentional exceptions with a comment).

**Step 7: Typecheck**

```bash
pnpm nx run @org/web:typecheck
```
Expected: same pre-existing errors only (date-picker `asChild`, register form nullability).

**Step 8: Commit**

```bash
git add apps/web/app/routes/ apps/web/app/components/StatCard.tsx
git commit -m "refactor: replace all hardcoded colors with shadcn semantic tokens"
```

---

## Done

After all 5 tasks, the Coros frontend:
- Has a proper collapsible shadcn Sidebar with `SidebarProvider`
- Has Sheet animation working everywhere
- Has EmployeeForm using bare shadcn defaults
- Has DataTable with correct composition pattern
- Has zero hardcoded `bg-white`, `text-zinc-*`, `border-zinc-*`, `focus:ring-0` in feature files
