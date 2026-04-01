import Link from "next/link";
import { APP_URL, GITHUB_URL, LICENSE_URL } from "@/lib/landing-links";

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

export function Footer() {
  return (
    <footer className="border-t border-zinc-200/80 bg-background py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-2.5">
          <LogoMark />
          <p className="text-sm text-zinc-500">
            © 2026 Coros. AGPL licensed.
          </p>
        </div>

        <nav
          className="flex flex-wrap gap-x-8 gap-y-2"
          aria-label="Footer"
        >
          <Link
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-800"
          >
            GitHub
          </Link>
          <Link
            href={LICENSE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-800"
          >
            License
          </Link>
          <Link
            href={APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-800"
          >
            App
          </Link>
        </nav>
      </div>
    </footer>
  );
}
