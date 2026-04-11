import Image from "next/image";

const DASHBOARD_SVG = "/assets/dashboard.svg";

export function Mockup() {
  return (
    <div className="relative mx-auto w-full">
      <div
        className="relative overflow-hidden bg-[var(--bg)]"
        style={{
          border: "1px solid var(--border)",
          borderRadius: "12px",
        }}
      >
        {/* Browser chrome */}
        <div
          className="flex items-center gap-2 px-3 py-2.5"
          style={{
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-secondary)",
          }}
        >
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div
            className="ml-1 min-w-0 flex-1 rounded-md bg-[var(--bg)] px-3 py-1 text-left text-[11px] leading-none text-[var(--text-tertiary)]"
            style={{ border: "1px solid var(--border)" }}
          >
            app.coros.click
          </div>
        </div>

        {/* Dashboard screenshot */}
        <div className="bg-[var(--bg-secondary)]">
          <Image
            src={DASHBOARD_SVG}
            alt="Coros admin dashboard with overview, onboarding, metrics, tasks, and leave requests"
            width={1689}
            height={881}
            className="h-auto w-full"
            sizes="(min-width: 960px) 960px, 100vw"
            unoptimized
            priority
          />
        </div>

        {/* Bottom fade overlay — image fades to white */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0"
          style={{
            height: "200px",
            background: "linear-gradient(to bottom, transparent, var(--hero-fade))",
          }}
          aria-hidden
        />
      </div>
    </div>
  );
}
