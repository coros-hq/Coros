import Link from "next/link";
import { REGISTER_URL, SELF_HOST_GUIDE_URL } from "@/lib/landing-links";

export function BottomCta() {
  return (
    <section
      aria-labelledby="bottom-cta-heading"
      className="text-center"
      style={{ background: "#0f0f0f", padding: "120px 48px" }}
    >
      <h2
        id="bottom-cta-heading"
        className="mx-auto font-semibold text-white"
        style={{
          fontSize: "clamp(36px, 5vw, 60px)",
          letterSpacing: "-0.035em",
          lineHeight: 1.1,
          maxWidth: "700px",
        }}
      >
        Your team deserves
        <br />
        better than spreadsheets.
      </h2>

      <p
        className="mx-auto text-[16px]"
        style={{ color: "#737373", marginTop: "16px", maxWidth: "360px" }}
      >
        Set up in minutes. Free to start.
      </p>

      <div
        className="inline-flex flex-wrap items-center justify-center gap-3"
        style={{ marginTop: "40px" }}
      >
        <Link
          href={REGISTER_URL}
          className="inline-flex items-center rounded-[9px] bg-white text-[14px] font-semibold text-[#0f0f0f] transition-colors hover:bg-[#f0f0f0]"
          style={{ padding: "11px 24px" }}
        >
          Start for free
        </Link>
        <Link
          href={SELF_HOST_GUIDE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-[9px] text-[14px] font-medium transition-colors"
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.7)",
            padding: "11px 24px",
          }}
        >
          Self-hosting guide
        </Link>
      </div>
    </section>
  );
}
