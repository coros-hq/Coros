function FeatureVisual({ tone }: { tone: "a" | "b" | "c" }) {
  const grad = {
    a: "from-purple-500/[0.08] via-zinc-50/90 to-white",
    b: "from-violet-500/[0.07] via-zinc-50/90 to-white",
    c: "from-purple-600/[0.07] via-zinc-50/90 to-white",
  }[tone];

  return (
    <div
      className={`relative min-h-[240px] w-full overflow-hidden rounded-2xl border border-zinc-200/70 bg-gradient-to-br ${grad} shadow-[0_1px_0_rgba(24,24,27,0.05)] md:min-h-[300px]`}
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_80%_-10%,rgba(124,58,237,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-[7%] rounded-xl border border-white/70 bg-white/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-[1px]" />
      <div className="pointer-events-none absolute bottom-[10%] left-[10%] right-[10%] flex items-center justify-between gap-4">
        <div className="h-1.5 w-[28%] max-w-[12rem] rounded-full bg-zinc-200/90" />
        <div className="hidden h-1.5 w-[12%] rounded-full bg-purple-300/80 sm:block" />
      </div>
    </div>
  );
}

const featureGroups = [
  {
    id: "feature-people" as const,
    version: "1.0",
    label: "People & HR",
    headline: "People & HR",
    body: (
      <p>
        Onboard employees, manage departments, handle leave requests and keep
        your org chart up to date — all in one place. Admins, managers and
        employees each see exactly what they need — nothing more, nothing less.
        Built for your whole organization — every department, every team, one
        clean workspace.
      </p>
    ),
    visualTone: "a" as const,
  },
  {
    id: "feature-projects" as const,
    version: "2.0",
    label: "Projects & tasks",
    headline: "Projects & tasks",
    body: (
      <p>
        Create projects, assign tasks to your team and track progress without
        losing anything in chat threads
      </p>
    ),
    visualTone: "b" as const,
  },
  {
    id: "feature-documents" as const,
    version: "3.0",
    label: "Documents & announcements",
    headline: "Documents & announcements",
    body: (
      <p>
        Store company policies, contracts and files where your whole team can
        find them — with the right access for each role. Send company-wide
        updates that actually get seen — no more pinned messages nobody reads.
      </p>
    ),
    visualTone: "c" as const,
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-zinc-200/80 bg-background">
      <div className="mx-auto max-w-7xl px-4 pb-32 pt-32 sm:px-6 md:pb-40 md:pt-40 lg:px-8 lg:pb-48 lg:pt-48">
        <p className="text-left text-xs font-medium uppercase tracking-widest text-purple-600">
          Features
        </p>
        <h2 className="mt-4 max-w-3xl text-left font-serif text-5xl font-normal leading-[1.12] tracking-tight text-zinc-900 md:text-6xl">
          Everything your company runs on
        </h2>
      </div>

      {featureGroups.map((block, index) => (
        <div
          key={block.id}
          id={block.id}
          className={
            index > 0
              ? "border-t border-zinc-200/60 bg-background"
              : "bg-background"
          }
        >
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32 lg:px-8 lg:py-40">
            <p className="text-left text-sm font-medium text-zinc-500">
              <span className="font-mono tabular-nums text-purple-600">
                {block.version}
              </span>
              <span className="text-zinc-400">{"  "}</span>
              {block.label}
              <span className="text-zinc-400" aria-hidden>
                {" "}
                →
              </span>
            </p>

            <div className="mt-8 grid gap-10 lg:mt-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-x-16 xl:gap-x-20">
              <h3 className="text-left font-serif text-5xl font-normal leading-[1.1] tracking-tight text-zinc-900 md:text-6xl lg:text-[3.5rem] lg:leading-[1.08]">
                {block.headline}
              </h3>
              <div className="space-y-6 text-left text-lg leading-[1.65] text-zinc-600">
                {block.body}
              </div>
            </div>

            <div className="mt-16 md:mt-20">
              <FeatureVisual tone={block.visualTone} />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
