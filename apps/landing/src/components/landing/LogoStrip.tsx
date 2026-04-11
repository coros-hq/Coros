export function LogoStrip() {
  return (
    <section
      aria-label="Social proof"
      className="bg-[var(--bg-secondary)]"
      style={{
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        padding: "16px 0",
      }}
    >
      <p
        className="landing-container text-center text-[12px] font-normal uppercase text-[var(--text-tertiary)]"
        style={{ letterSpacing: "0.08em" }}
      >
        Trusted by growing teams replacing Excel and WhatsApp
      </p>
    </section>
  );
}
