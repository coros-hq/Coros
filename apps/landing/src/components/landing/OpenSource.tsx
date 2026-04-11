import Link from "next/link";
import { GITHUB_URL, SELF_HOST_GUIDE_URL } from "@/lib/landing-links";

export function OpenSource() {
  return (
    <section
      id="open-source"
      className="bg-[var(--bg)]"
      style={{
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        padding: "100px 48px",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "860px" }}>
        <p
          className="text-[11px] font-medium uppercase text-[var(--text-tertiary)]"
          style={{ letterSpacing: "0.1em" }}
        >
          Open source
        </p>
        <h2
          className="mt-3 font-semibold text-[var(--text-primary)]"
          style={{ fontSize: "clamp(32px, 4vw, 48px)", letterSpacing: "-0.03em", lineHeight: 1.1, maxWidth: "480px" }}
        >
          Built in public.
          <br />
          Owned by you.
        </h2>
        <p
          className="mt-6 text-[15px] leading-[1.6] text-[var(--text-secondary)]"
          style={{ maxWidth: "520px" }}
        >
          Coros is fully open source under AGPL. If your company has an IT team
          and wants full control, you can self-host on your own infrastructure.
          Audit the code, fork it, or contribute — it&apos;s yours.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-[9px] bg-[#5b45e0] text-[14px] font-medium text-white transition-colors hover:bg-[#4936c2]"
            style={{ padding: "10px 22px" }}
          >
            View on GitHub
          </Link>
          <Link
            href={SELF_HOST_GUIDE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-[9px] bg-[var(--bg)] text-[14px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)]"
            style={{ border: "1px solid var(--border-strong)", padding: "10px 22px" }}
          >
            Self-host guide
          </Link>
        </div>
      </div>
    </section>
  );
}
