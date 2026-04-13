"use client";

import Link from "next/link";
import { useState } from "react";
import { Github, Menu, X } from "lucide-react";
import { DISCORD_URL, GITHUB_URL, REGISTER_URL } from "@/lib/landing-links";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/landing/ThemeToggle";
import DiscordIcon from "@/../public/assets/discord-icon.svg";
import Image from "next/image";

function LogoMark() {
  return (
    <svg
      width="24"
      height="24"
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

type NavItem = {
  href: string;
  label: string;
};

const navLinks: NavItem[] = [
  { href: "#features", label: "Features" },
  { href: "#open-source", label: "Open source" },
  { href: "#pricing", label: "Pricing" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div
        className="absolute inset-0"
        style={{ background: "var(--nav-bg)", backdropFilter: "blur(12px)" }}
        aria-hidden
      />
      <div className="landing-container relative flex h-[56px] items-center justify-between">
        <Link
          href="/"
          className="relative z-10 flex min-w-0 items-center gap-2"
          style={{ color: "var(--text-primary)" }}
        >
          <LogoMark />
          <span
            className="text-[16px] font-semibold leading-none"
            style={{ letterSpacing: "-0.02em" }}
          >
            Coros
          </span>
        </Link>

        <nav
          className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 md:flex"
          aria-label="Primary"
        >
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-[14px] font-normal leading-none text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="relative z-10 hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-secondary)]"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Coros on GitHub"
          >
            <Github className="size-4" aria-hidden />
          </Link>
          <Link
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-secondary)]"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Coros on Discord"
          >
            <Image src={DiscordIcon} alt="Discord" className="size-5" />
          </Link>
          
        </div>

        <div className="relative z-10 flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Link
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-secondary)]"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Coros on GitHub"
          >
            <Github className="size-4" aria-hidden />
          </Link>
          <button
            type="button"
            className="rounded-md p-2 transition-colors"
            style={{ color: "var(--text-secondary)" }}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "relative md:hidden",
          open ? "block" : "hidden"
        )}
        style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}
      >
        <nav
          className="landing-container flex flex-col gap-1 py-4"
          aria-label="Mobile"
        >
          {navLinks.map((item) => (
            <Link
              key={`${item.label}-mobile`}
              href={item.href}
              className="py-2 text-[14px] transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={REGISTER_URL}
            className="mt-2 inline-flex w-full items-center justify-center rounded-[8px] text-[13px] font-medium text-white"
            style={{ background: "var(--accent)", padding: "10px 16px" }}
            onClick={() => setOpen(false)}
          >
            Get started free
          </Link>
        </nav>
      </div>
    </header>
  );
}
