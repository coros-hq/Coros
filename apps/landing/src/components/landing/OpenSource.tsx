import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GITHUB_URL, SELF_HOST_GUIDE_URL } from "@/lib/landing-links";

const stack = [
  "NestJS",
  "React Router v7",
  "TypeORM",
  "PostgreSQL",
  "Redis",
  "shadcn/ui",
  "Tailwind CSS",
  "Docker",
  "NX Monorepo",
  "JWT + RBAC",
];

export function OpenSource() {
  return (
    <section
      id="open-source"
      className="border-t border-zinc-200/80 bg-background py-16 md:py-24"
    >
      <div className="relative mx-4 overflow-hidden rounded-2xl border border-zinc-200/90 bg-card py-20 px-12 shadow-sm md:mx-8 md:px-16">
        <div
          className="pointer-events-none absolute bottom-0 right-0 size-96 rounded-full bg-purple-500/10 blur-3xl"
          aria-hidden
        />

        <div className="relative grid gap-12 md:grid-cols-2 md:items-start md:gap-16">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-purple-600">
              Open source
            </p>
            <h2 className="mt-3 font-serif text-4xl tracking-tight text-zinc-900">
              Built in public. Owned by you.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-600">
              AGPL-licensed source you can audit, fork, and run on your own
              infrastructure. Contribute upstream, self-host, or use the cloud
              when it fits.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                asChild
                size="lg"
                className="h-10 rounded-lg border-0 bg-[#7c3aed] px-5 text-sm font-medium text-white hover:bg-[#6d28d9]"
              >
                <Link
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-10 rounded-lg border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
              >
                <Link
                  href={SELF_HOST_GUIDE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Self-host guide
                </Link>
              </Button>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
              Built with
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {stack.map((item) => (
                <li key={item}>
                  <span className="inline-block rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
