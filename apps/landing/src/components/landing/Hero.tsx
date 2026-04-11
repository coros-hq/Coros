import Link from "next/link";
import { REGISTER_URL, SELF_HOST_GUIDE_URL } from "@/lib/landing-links";
import { Mockup } from "@/components/landing/Mockup";

export function Hero() {
  return (
    <section className="bg-[var(--bg)]" style={{ paddingTop: "120px", paddingBottom: "80px" }}>
      <div className="landing-container">
        {/* Centered hero copy — max 680px */}
        <div className="mx-auto max-w-[680px] text-center">
          {/* Eyebrow badge */}
          <div className="mb-7 inline-flex items-center gap-1.5 rounded-full text-[12px] font-medium"
            style={{
              background: "var(--accent-light)",
              color: "var(--accent)",
              padding: "4px 12px",
            }}
          >
            Open source · AGPL licensed
          </div>

          {/* Headline */}
          <h1
            className="font-semibold text-[var(--text-primary)]"
            style={{
              fontSize: "clamp(40px, 6vw, 64px)",
              letterSpacing: "-0.035em",
              lineHeight: 1.08,
            }}
          >
            The operating system
            <br />
            for your team.
          </h1>

          {/* Subheadline */}
          <p
            className="mx-auto text-[17px] leading-[1.6] text-[var(--text-secondary)]"
            style={{ maxWidth: "460px", marginTop: "20px" }}
          >
            HR, people, projects and leave — in one place. Simple enough for
            everyone, powerful enough to grow.
          </p>

          {/* CTAs */}
          <div className="inline-flex flex-wrap items-center justify-center gap-[10px]" style={{ marginTop: "36px" }}>
            <Link
              href={REGISTER_URL}
              className="inline-flex items-center rounded-[9px] bg-[#5b45e0] text-[14px] font-medium text-white transition-colors hover:bg-[#4936c2]"
              style={{ padding: "10px 22px" }}
            >
              Start for free
            </Link>
            <Link
              href={SELF_HOST_GUIDE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-[9px] bg-[var(--bg)] text-[14px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)]"
              style={{ border: "1px solid var(--border-strong)", padding: "10px 22px" }}
            >
              Self-hosting guide
            </Link>
          </div>

          {/* Social proof */}
          <p
            className="text-[12px] text-[var(--text-tertiary)]"
            style={{ marginTop: "20px", letterSpacing: "0.01em" }}
          >
            Free to start · No credit card · Cancel anytime
          </p>
        </div>

        {/* Hero image — browser chrome mockup */}
        <div className="mx-auto w-full max-w-[960px]" style={{ marginTop: "64px" }}>
          <Mockup />
        </div>
      </div>
    </section>
  );
}
