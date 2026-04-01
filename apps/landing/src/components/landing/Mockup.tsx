const navItems = [
  { label: "Overview", active: true },
  { label: "People", active: false },
  { label: "Projects", active: false },
  { label: "Docs", active: false },
];

const stats = [
  { label: "Team", value: "24" },
  { label: "Projects", value: "12" },
  { label: "Open tasks", value: "38" },
];

const tasks = [
  { title: "Q1 planning doc", dot: "bg-blue-500" },
  { title: "Onboarding: Jordan", dot: "bg-amber-500" },
  { title: "Policy review", dot: "bg-green-500" },
  { title: "Infra: Redis upgrade", dot: "bg-purple-500" },
];

export function Mockup() {
  return (
    <div className="relative mx-auto w-full shadow-[0_0_80px_rgba(124,58,237,0.08)]">
      <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-zinc-200/90 bg-zinc-100 px-3 py-2.5">
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="ml-1 min-w-0 flex-1 rounded-md border border-zinc-200/80 bg-white px-3 py-1 text-left text-xs text-zinc-500">
            app.coros.click
          </div>
        </div>

        <div className="flex min-h-[240px] md:min-h-[300px]">
          <aside className="w-32 shrink-0 border-r border-zinc-200/90 bg-zinc-50 p-2 md:w-40">
            <nav className="space-y-0.5 text-left text-[11px] md:text-xs" aria-hidden>
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className={
                    item.active
                      ? "rounded-md bg-zinc-200/80 px-2 py-1.5 font-medium text-zinc-900"
                      : "rounded-md px-2 py-1.5 text-zinc-500"
                  }
                >
                  {item.label}
                </div>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 flex-1 bg-white p-3 md:p-4">
            <div className="grid grid-cols-3 gap-2">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-zinc-200/90 bg-zinc-50 p-2 md:p-3"
                >
                  <p className="text-[10px] text-zinc-500 md:text-xs">{s.label}</p>
                  <p className="mt-1 font-medium tabular-nums text-zinc-900 md:text-lg">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-2 border-t border-zinc-200/80 pt-3 text-left">
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 md:text-xs">
                Recent
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-700 md:text-xs">
                  All clear
                </span>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-800 md:text-xs">
                  2 reviews
                </span>
              </div>
              <ul className="space-y-1.5 pt-1">
                {tasks.map((t) => (
                  <li
                    key={t.title}
                    className="flex items-center gap-2 text-[11px] text-zinc-600 md:text-xs"
                  >
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${t.dot}`}
                      aria-hidden
                    />
                    <span className="truncate">{t.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
