"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GITHUB_URL, REGISTER_URL } from "@/lib/landing-links";
import { cn } from "@/lib/utils";

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

type NavItem = {
  href: string;
  label: string;
  external?: boolean;
};

const navLinks: NavItem[] = [
  { href: "#features", label: "Features" },
  { href: "#open-source", label: "Open source" },
  { href: "#pricing", label: "Pricing" },
  { href: GITHUB_URL, label: "GitHub", external: true },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-zinc-200/80 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-zinc-900"
        >
          <LogoMark />
          <span className="font-serif text-base font-normal">Coros</span>
        </Link>

        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Primary"
        >
          {navLinks.map((item) =>
            item.external ? (
              <Link
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-600 transition-colors hover:text-zinc-900"
              >
                {item.label}
              </Link>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm text-zinc-600 transition-colors hover:text-zinc-900"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden md:block">
          <Button
            asChild
            size="lg"
            className="h-9 rounded-lg border-0 bg-[#7c3aed] px-4 py-2 text-sm font-medium text-white hover:bg-[#6d28d9]"
          >
            <Link href={REGISTER_URL}>Get started free</Link>
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "border-b border-zinc-200/80 bg-background/95 backdrop-blur-xl md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <nav
          className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6"
          aria-label="Mobile"
        >
          {navLinks.map((item) =>
            item.external ? (
              <Link
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 text-sm text-zinc-600 transition-colors hover:text-zinc-900"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="py-2 text-sm text-zinc-600 transition-colors hover:text-zinc-900"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            )
          )}
          <Button
            asChild
            size="lg"
            className="mt-2 h-10 w-full rounded-lg border-0 bg-[#7c3aed] text-sm font-medium text-white hover:bg-[#6d28d9]"
          >
            <Link href={REGISTER_URL} onClick={() => setOpen(false)}>
              Get started free
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
