import Link from "next/link";
import { Button } from "@/components/ui/button";
import { REGISTER_URL, SELF_HOST_GUIDE_URL } from "@/lib/landing-links";
import { Mockup } from "@/components/landing/Mockup";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section
      className={cn(
        "relative overflow-x-hidden pb-16 pt-28 md:pb-24 md:pt-32",
        "hero-ambient"
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:items-start lg:gap-x-16 xl:gap-x-20">
          <div className="min-w-0 text-left">
            <h1 className="font-sans text-[clamp(2.75rem,6.5vw,5rem)] font-bold leading-[1.08] tracking-tight text-zinc-900">
              <span className="block">Stop running your company</span>
              <span className="mt-1 block text-zinc-500">
                on WhatsApp and spreadsheets
              </span>
            </h1>
          </div>

          <div className="flex min-w-0 flex-col text-left lg:pt-2">
            <p className="text-lg font-normal leading-[1.65] text-zinc-600 md:text-[1.125rem]">
              Coros gives your team one place for HR, projects, documents and
              leave — simple enough for everyone, powerful enough to grow with
              you.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                asChild
                size="lg"
                className="h-12 min-w-40 rounded-lg border-0 bg-[#7c3aed] px-6 text-base font-medium text-white hover:bg-[#6d28d9]"
              >
                <Link href={REGISTER_URL}>Start for free</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 min-w-40 rounded-lg border border-zinc-200 bg-white px-6 text-base font-medium text-zinc-700 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
              >
                <Link
                  href={SELF_HOST_GUIDE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Self-hosting guide
                </Link>
              </Button>
            </div>

            <p className="mt-8 text-base text-zinc-500">
              Free to start · No credit card · Cancel anytime
            </p>

            <p className="mt-4 text-base font-medium text-zinc-600">
              Trusted by teams getting started
            </p>

            <div
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-purple-500/25 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-800"
              role="status"
            >
              <span className="relative flex size-2" aria-hidden>
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              Open source · AGPL licensed
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-20 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mx-4 sm:-mx-6 lg:-mx-8">
          <Mockup />
        </div>
      </div>
    </section>
  );
}
