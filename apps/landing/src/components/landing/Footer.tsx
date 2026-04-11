import type { ReactNode } from "react";
import Link from "next/link";
import {
  ABOUT_ANCHOR,
  APP_URL,
  CONTACT_EMAIL,
  GITHUB_URL,
  LICENSE_URL,
  LINKEDIN_URL,
} from "@/lib/landing-links";

function LogoMark() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 48 48"
      fill="none"
      className="shrink-0"
      aria-hidden
    >
      <rect width="48" height="48" rx="10" fill="#5B45E0" />
      <path
        d="M31 13 A13 13 0 1 0 31 35"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M31 19.5 A7.5 7.5 0 1 0 31 28.5"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeOpacity="0.55"
      />
    </svg>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p
        className="text-[11px] font-medium uppercase leading-none text-[var(--text-tertiary)]"
        style={{ letterSpacing: "0.1em" }}
      >
        {title}
      </p>
      <ul className="mt-4 space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  if (external) {
    return (
      <li>
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] leading-[1.6] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          {children}
        </Link>
      </li>
    );
  }
  return (
    <li>
      <Link
        href={href}
        className="text-[13px] leading-[1.6] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        {children}
      </Link>
    </li>
  );
}

export function Footer() {
  return (
    <footer
      className="bg-[var(--bg)] py-16 md:py-20"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="landing-container">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-12 lg:gap-16">
          <FooterColumn title="Product">
            <FooterLink href={APP_URL} external>
              App
            </FooterLink>
            <FooterLink href="/#pricing">Pricing</FooterLink>
          </FooterColumn>

          <FooterColumn title="Features">
            <FooterLink href="/#feature-leave-calendar">
              Leave calendar
            </FooterLink>
            <FooterLink href="/#feature-org-chart">Org chart</FooterLink>
            <FooterLink href="/#feature-employee-profiles">
              Employee profiles
            </FooterLink>
            <FooterLink href="/#feature-announcements">Announcements</FooterLink>
            <FooterLink href="/#feature-tasks-kanban">Tasks &amp; Kanban</FooterLink>
          </FooterColumn>

          <FooterColumn title="Company">
            <FooterLink href={ABOUT_ANCHOR}>About</FooterLink>
            <FooterLink href={GITHUB_URL} external>
              GitHub
            </FooterLink>
            <FooterLink href={LICENSE_URL} external>
              License
            </FooterLink>
          </FooterColumn>

          <FooterColumn title="Connect">
            <FooterLink href={LINKEDIN_URL} external>
              LinkedIn
            </FooterLink>
            <FooterLink href={CONTACT_EMAIL} external>
              Email
            </FooterLink>
          </FooterColumn>
        </div>

        <div
          className="mt-16 flex flex-col gap-6 pt-10 md:mt-20 md:flex-row md:items-end md:justify-between"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="max-w-md space-y-2">
            <p className="text-[13px] leading-[1.6] text-[var(--text-secondary)]">
              Coros — HR, projects and documents for growing teams
            </p>
            <div className="flex items-center gap-2.5">
              <LogoMark />
              <p className="text-[13px] leading-[1.6] text-[var(--text-tertiary)]">
                © 2026 Coros. AGPL licensed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
