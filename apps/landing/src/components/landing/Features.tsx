import {
  Building2,
  FileText,
  LayoutGrid,
  Megaphone,
  Shield,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "People & HR",
    description:
      "Directory, roles, and time-off in one place — built for small teams.",
  },
  {
    icon: LayoutGrid,
    title: "Projects & tasks",
    description:
      "Track work across projects with clear ownership and status.",
  },
  {
    icon: FileText,
    title: "Documents",
    description:
      "Policies and files with version history and simple permissions.",
  },
  {
    icon: Shield,
    title: "Role-based access",
    description: "JWT sessions with RBAC — least privilege by default.",
  },
  {
    icon: Building2,
    title: "Multi-tenant",
    description: "Isolate orgs cleanly — ready for self-hosted and cloud.",
  },
  {
    icon: Megaphone,
    title: "Announcements",
    description:
      "Broadcast updates so everyone stays aligned without extra noise.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="border-t border-zinc-200/80 bg-background py-32"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-widest text-purple-600">
          Features
        </p>
        <h2 className="mt-3 font-serif text-4xl tracking-tight text-zinc-900">
          Everything your company runs on
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-zinc-200/90 bg-zinc-200/80 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-background p-8 transition-colors hover:bg-zinc-50/80"
            >
              <div className="inline-flex size-9 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 p-2">
                <f.icon
                  className="size-4 text-purple-600"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </div>
              <h3 className="mt-4 text-sm font-medium text-zinc-900">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
