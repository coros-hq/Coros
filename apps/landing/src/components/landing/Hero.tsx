import Link from "next/link";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GITHUB_URL, REGISTER_URL } from "@/lib/landing-links";
import { Mockup } from "@/components/landing/Mockup";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section
      className={cn(
        "relative min-h-screen overflow-hidden pt-24 pb-20",
        "flex flex-col items-center text-center",
        "hero-ambient"
      )}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 sm:px-6">
        <div
          className="inline-flex items-center gap-2 rounded-full border border-purple-500/25 bg-purple-500/10 px-3 py-1 text-xs text-purple-700"
          role="status"
        >
          <span
            className="relative flex size-2"
            aria-hidden
          >
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Open source · AGPL licensed
        </div>

        <h1 className="font-serif text-6xl font-normal leading-none tracking-tight text-zinc-900 md:text-8xl">
          The company OS
          <br />
          built{" "}
          <em className="italic text-zinc-500">in the open</em>
        </h1>

        <p className="mx-auto mt-6 max-w-lg text-lg text-zinc-600">
          HR, employees, projects, and documents in one calm surface — free to
          self-host, or use the cloud when you are ready.
        </p>

        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Button
            asChild
            size="lg"
            className="h-11 min-w-40 rounded-lg border-0 bg-[#7c3aed] px-6 text-sm font-medium text-white hover:bg-[#6d28d9]"
          >
            <Link href={REGISTER_URL}>Start for free</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-11 min-w-40 rounded-lg border border-zinc-200 bg-white px-6 text-sm font-medium text-zinc-700 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
          >
            <Link
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <Github className="size-4" aria-hidden />
              View on GitHub
            </Link>
          </Button>
        </div>

        <p className="mt-8 text-sm text-zinc-500">
          Free to self-host · AGPL licensed · Built in public
        </p>
      </div>

      <div className="relative mt-20 w-full max-w-5xl px-4 sm:px-6">
        <Mockup />
      </div>
    </section>
  );
}
