import Link from "next/link";
import { GITHUB_URL, REGISTER_URL } from "@/lib/landing-links";

const selfHostedFeatures = [
  "Full control over your data",
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
    <li className="flex items-baseline gap-[10px]">
      <span className="shrink-0 text-[14px] font-medium text-[var(--accent)]" aria-hidden>
        ✓
      </span>
      <span className="text-[14px] leading-[2.0] text-[var(--text-secondary)]">{children}</span>
    </li>
  );
}

export function Pricing() {
  return (
    <section
      id="pricing"
      className="bg-[var(--bg-secondary)]"
      style={{
        borderTop: "1px solid var(--border)",
        padding: "100px 48px",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "860px" }}>
        {/* Header — left-aligned */}
        <p
          className="text-[11px] font-medium uppercase text-[var(--text-tertiary)]"
          style={{ letterSpacing: "0.1em" }}
        >
          Pricing
        </p>
        <h2
          className="mt-3 font-semibold text-[var(--text-primary)]"
          style={{ fontSize: "clamp(32px, 4vw, 48px)", letterSpacing: "-0.03em", lineHeight: 1.1 }}
        >
          Simple and predictable
        </h2>
        <p className="mt-4 text-[15px] leading-[1.6] text-[var(--text-secondary)]">
          Start free on the cloud, or run it yourself.
        </p>

        {/* Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Self-hosted card */}
          <div
            className="rounded-[12px] bg-[var(--bg)] p-8"
            style={{ border: "1px solid var(--border)" }}
          >
            <h3 className="text-[13px] font-normal text-[var(--text-secondary)]">Self-hosted</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span
                className="font-semibold text-[var(--text-primary)]"
                style={{ fontSize: "48px", letterSpacing: "-0.04em", lineHeight: 1 }}
              >
                Free
              </span>
            </div>
            <p className="mt-4 text-[14px] leading-[1.6] text-[var(--text-secondary)]">
              Run Coros on your own infrastructure.
            </p>
            <ul className="mt-6 flex flex-col">
              {selfHostedFeatures.map((item) => (
                <CheckRow key={item}>{item}</CheckRow>
              ))}
            </ul>
            <Link
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 flex w-full items-center justify-center rounded-[8px] bg-[var(--bg)] text-[14px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)]"
              style={{
                border: "1px solid var(--border-strong)",
                padding: "10px",
              }}
            >
              View on GitHub
            </Link>
          </div>

          {/* Cloud card — featured */}
          <div
            className="relative rounded-[12px] bg-[var(--bg)] p-8"
            style={{ border: "1px solid var(--accent)" }}
          >
            {/* Featured badge — centered at top */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
              <span
                className="inline-flex items-center rounded-full text-[11px] font-medium text-[var(--accent)]"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--accent)",
                  padding: "3px 10px",
                }}
              >
                Cloud beta
              </span>
            </div>

            <h3 className="text-[13px] font-normal text-[var(--text-secondary)]">Cloud</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span
                className="font-semibold text-[var(--text-primary)]"
                style={{ fontSize: "48px", letterSpacing: "-0.04em", lineHeight: 1 }}
              >
                $0
              </span>
              <span className="text-[15px] text-[var(--text-secondary)]">/ mo during beta</span>
            </div>
            <p className="mt-4 text-[14px] leading-[1.6] text-[var(--text-secondary)]">
              We handle everything — you just run your company.
            </p>
            <ul className="mt-6 flex flex-col">
              {cloudFeatures.map((item) => (
                <CheckRow key={item}>{item}</CheckRow>
              ))}
            </ul>
            <Link
              href={REGISTER_URL}
              className="mt-8 flex w-full items-center justify-center rounded-[8px] bg-[#5b45e0] text-[14px] font-medium text-white transition-colors hover:bg-[#4936c2]"
              style={{ padding: "10px" }}
            >
              Start for free
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
