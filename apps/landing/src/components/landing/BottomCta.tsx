import Link from "next/link";
import { Button } from "@/components/ui/button";
import { REGISTER_URL, SELF_HOST_GUIDE_URL } from "@/lib/landing-links";

export function BottomCta() {
  return (
    <section
      aria-labelledby="bottom-cta-heading"
      className="relative border-t border-zinc-200/80 bg-gradient-to-b from-purple-500/[0.045] via-purple-500/[0.02] to-transparent py-32 md:py-40 lg:py-48"
    >
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2
          id="bottom-cta-heading"
          className="font-serif text-5xl font-normal leading-[1.1] tracking-tight text-zinc-900 md:text-6xl lg:text-7xl"
        >
          Your team deserves better than spreadsheets.
        </h2>
        <p className="mx-auto mt-8 max-w-lg text-lg leading-[1.65] text-zinc-600">
          Set up in minutes. Free to start.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-12 min-w-44 rounded-lg border-0 bg-[#7c3aed] px-8 text-base font-medium text-white hover:bg-[#6d28d9]"
          >
            <Link href={REGISTER_URL}>Start for free</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 min-w-44 rounded-lg border border-zinc-200 bg-white px-8 text-base font-medium text-zinc-700 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
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
      </div>
    </section>
  );
}
