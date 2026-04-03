import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GITHUB_URL, SELF_HOST_GUIDE_URL } from "@/lib/landing-links";

export function OpenSource() {
  return (
    <section
      id="open-source"
      className="border-t border-zinc-200/80 bg-background py-32 md:py-40 lg:py-48"
    >
      <div className="relative mx-4 overflow-hidden rounded-2xl border border-zinc-200/90 bg-card shadow-sm md:mx-8">
        <div
          className="pointer-events-none absolute bottom-0 right-0 size-96 rounded-full bg-purple-500/10 blur-3xl"
          aria-hidden
        />

        <div className="relative grid gap-12 px-8 py-20 md:gap-16 md:px-12 md:py-24 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-start lg:px-16">
          <div className="text-left">
            <p className="text-xs font-medium uppercase tracking-widest text-purple-600">
              Open source
            </p>
            <h2 className="mt-4 max-w-xl font-serif text-5xl font-normal leading-[1.1] tracking-tight text-zinc-900 md:text-6xl lg:text-[3.5rem]">
              Built in public. Owned by you.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-[1.65] text-zinc-600">
              Coros is fully open source under AGPL. If your company has an IT
              team and wants full control, you can self-host on your own
              infrastructure. Audit the code, fork it, or contribute — it&apos;s
              yours.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:items-end lg:justify-end lg:pt-2">
            <Button
              asChild
              size="lg"
              className="h-11 w-full rounded-lg border-0 bg-[#7c3aed] px-6 text-base font-medium text-white hover:bg-[#6d28d9] sm:w-auto lg:min-w-[12rem]"
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
              className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-6 text-base font-medium text-zinc-700 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 sm:w-auto lg:min-w-[12rem]"
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
      </div>
    </section>
  );
}
