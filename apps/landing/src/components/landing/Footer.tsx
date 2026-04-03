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
      <rect width="48" height="48" rx="10" fill="#7c3aed" />
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
      <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
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
          className="text-sm text-zinc-600 transition-colors hover:text-zinc-900"
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
        className="text-sm text-zinc-600 transition-colors hover:text-zinc-900"
      >
        {children}
      </Link>
    </li>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-zinc-200/80 bg-background py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-12 lg:gap-16">
          <FooterColumn title="Product">
            <FooterLink href={APP_URL} external>
              App
            </FooterLink>
            <FooterLink href="/#pricing">Pricing</FooterLink>
          </FooterColumn>

          <FooterColumn title="Features">
            <FooterLink href="/#feature-people">HR &amp; People</FooterLink>
            <FooterLink href="/#feature-projects">Projects</FooterLink>
            <FooterLink href="/#feature-documents">Documents</FooterLink>
            <FooterLink href="/#feature-documents">Announcements</FooterLink>
            <FooterLink href="/#feature-people">Leave requests</FooterLink>
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

        <div className="mt-16 flex flex-col gap-6 border-t border-zinc-200/80 pt-10 md:mt-20 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md space-y-2">
            <p className="text-sm leading-relaxed text-zinc-600">
              Coros — HR, projects and documents for growing teams
            </p>
            <div className="flex items-center gap-2.5">
              <LogoMark />
              <p className="text-sm text-zinc-500">
                © 2026 Coros. AGPL licensed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
