# Shadcn UI consistency (Coros web)

## Goal

Use shadcn-style primitives under `apps/web/app/components/ui/*` for all interactive controls (inputs, buttons, select, dropdown, sheet, date picker, data table building blocks). Feature code composes these primitives only; avoid raw `<select>`, `<input>`, `<button>` in routes where a UI primitive exists.

## Decisions

- **Filters on list pages:** Use `Select` + `SelectTrigger` / `SelectContent` / `SelectItem` (not native `<select>`).
- **Status chips:** Use `Badge` with `variant="outline"` and token-based colors (`success`, `warning`, `muted`).
- **Typography / chrome:** Prefer design tokens (`text-foreground`, `text-foreground-muted`, `border-border`, `bg-card`, `ring-purple`, `ring-offset-canvas`) over ad hoc zinc scales.
- **JWT roles:** `AuthUser.role` includes `super_admin`; `auth-from-token` maps JWT `super_admin` to `super_admin` (not folded into `admin`) so permission checks stay correct.

## Follow-ups (optional)

- Add `alert.tsx` for error banners and replace inline destructive boxes.
- Add `card.tsx` and migrate `StatCard` to a Card-based layout.
- ESLint rule or codemod to forbid raw form controls outside `components/ui`.
