import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GITHUB_URL, REGISTER_URL } from "@/lib/landing-links";

const selfHostedFeatures = [
  "Full source under AGPL",
  "Docker-based deploy",
  "Your PostgreSQL & Redis",
  "Email hooks & SSO-ready",
  "Community support",
];

const cloudFeatures = [
  "Managed infrastructure",
  "Automatic updates",
  "Backups & monitoring",
  "Same codebase as self-host",
  "Email support during beta",
];

function CheckRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check
        className="mt-0.5 size-4 shrink-0 text-purple-600"
        strokeWidth={2}
        aria-hidden
      />
      <span className="text-sm text-zinc-600">{children}</span>
    </li>
  );
}

export function Pricing() {
  return (
    <section
      id="pricing"
      className="border-t border-zinc-200/80 bg-background py-32"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-widest text-purple-600">
          Pricing
        </p>
        <h2 className="mt-3 font-serif text-4xl tracking-tight text-zinc-900">
          Simple and predictable
        </h2>
        <p className="mt-4 max-w-lg text-zinc-600">
          Self-host for free forever, or join the cloud beta while we ship.
        </p>

        <div className="mt-14 grid gap-8 md:grid-cols-2 md:gap-6">
          <div className="rounded-xl border border-zinc-200/90 bg-card p-8 shadow-sm">
            <h3 className="text-sm font-medium text-zinc-900">
              Self-hosted
            </h3>
            <p className="mt-1 font-serif text-5xl text-zinc-900">Free</p>
            <p className="mt-1 text-sm text-zinc-600">
              Run Coros on your infrastructure.
            </p>
            <ul className="mt-8 flex flex-col gap-3">
              {selfHostedFeatures.map((item) => (
                <CheckRow key={item}>{item}</CheckRow>
              ))}
            </ul>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="mt-10 h-10 w-full rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
            >
              <Link href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                View on GitHub
              </Link>
            </Button>
          </div>

          <div className="relative rounded-xl border border-purple-300/80 bg-card p-8 shadow-sm ring-1 ring-purple-500/15">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-purple-200 bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
              Cloud beta
            </span>
            <h3 className="text-sm font-medium text-zinc-900">Cloud</h3>
            <p className="mt-1 font-serif text-5xl text-zinc-900">
              $0{" "}
              <span className="font-sans text-lg font-normal text-zinc-600">
                / mo during beta
              </span>
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              We host it — you use the same app.
            </p>
            <ul className="mt-8 flex flex-col gap-3">
              {cloudFeatures.map((item) => (
                <CheckRow key={item}>{item}</CheckRow>
              ))}
            </ul>
            <Button
              asChild
              size="lg"
              className="mt-10 h-10 w-full rounded-lg border-0 bg-[#7c3aed] text-sm font-medium text-white hover:bg-[#6d28d9]"
            >
              <Link href={REGISTER_URL}>Start for free</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
