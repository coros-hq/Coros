# Coros Frontend: Shadcn Design System Cleanup

**Date:** 2026-03-20  
**Approach:** Token-first cleanup + shadcn Sidebar replacement (Approach 1)

## Goal

Stop overriding shadcn defaults with hardcoded colors. Let the design system's CSS variable tokens (`bg-background`, `text-foreground`, `border-border`, `bg-primary`) do their job everywhere. Replace the bespoke sidebar with the proper shadcn Sidebar component.

## What Changes (visual layer only)

### 1. Sidebar — `apps/web/app/routes/_app.tsx`
- Install shadcn sidebar: `pnpm dlx shadcn@latest add sidebar`
- Wrap layout in `SidebarProvider`
- Replace `<aside>` with `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`
- Nav groups → `SidebarGroup` + `SidebarGroupLabel`
- Nav items → `SidebarMenu` + `SidebarMenuItem` + `SidebarMenuButton` with `isActive`
- Active state from `useLocation` (react-router), not NavLink class string
- Drop all hardcoded zinc/violet sidebar colors

### 2. Sheet animation fix
- Files: `_app.employees.tsx`, `_app._index.tsx`
- Pattern: `{open && <Sheet open>}` → `<Sheet open={open}>` (always mounted)
- Restores built-in slide-in/out animation

### 3. EmployeeForm — `apps/web/app/components/employees/EmployeeForm.tsx`
- Delete `inputClass`, `labelClass`, `selectTriggerClass`, `selectContentClass`, `selectItemClass` variables
- Remove all `className` props from `Input`, `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `Label`
- Field wrappers: `space-y-1.5` → `space-y-2`
- Submit: default `Button` variant (no `bg-violet-600`)
- Cancel: `variant="outline"` bare (no zinc overrides)
- Fix `DatePicker`: remove `border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50` and `focus-visible:ring-0`

### 4. DataTable — `apps/web/app/components/data-table/DataTable.tsx`
- `DropdownMenuTrigger render={<Button>}` → `DropdownMenuTrigger asChild` + `<Button>` child
- Remove remaining `bg-white`, `text-black` instances
- Normalize cell/header token usage

### 5. Token sweep — all remaining files
Replace every hardcoded value:

| Old | New |
|-----|-----|
| `bg-white` | `bg-background` |
| `text-zinc-900` | `text-foreground` |
| `text-zinc-500` / `text-zinc-600` | `text-muted-foreground` |
| `border-zinc-200` | `border-border` |
| `bg-zinc-50` / `bg-zinc-100` | `bg-muted` or `bg-accent` |
| `bg-violet-600` | `bg-primary` |
| `text-white` | `text-primary-foreground` |
| `focus-visible:ring-0` / `focus:ring-0` | *(remove — preserve shadcn ring)* |
| `text-black` | `text-foreground` |

Files in scope: all 17 `apps/web/app/routes/*.tsx` + `components/data-table/DataTable.tsx` + `components/employees/EmployeeForm.tsx` + `components/StatCard.tsx` + `components/ui/date-picker.tsx` + `routes/_app._index.tsx` sidebar local StatCard.

## What Does NOT Change
- Business logic, API calls, Zustand stores
- Route structure and file names
- Component props and interfaces
- Zod schemas and validation logic
- Animation keyframes and design tokens in `tailwind.config.ts`
- CSS variable values in `app.css`

## Success Criteria
- Zero `bg-white`, `text-zinc-*`, `border-zinc-*`, `bg-violet-600`, `text-black`, `focus-visible:ring-0` in non-UI-primitive files
- Sheet slides in/out on open/close
- EmployeeForm looks identical but uses shadcn defaults
- Sidebar uses `SidebarProvider` and collapses/expands correctly
