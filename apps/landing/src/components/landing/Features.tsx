"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ASSETS = {
  leave: "/assets/calendar.svg",
  orgChart: "/assets/org.svg",
  employees: "/assets/employees.svg",
  announcements: "/assets/announcement.svg",
  tasks: "/assets/tasks.svg",
} as const;

type FeatureBlock = {
  id: string;
  number: string;
  headline: string;
  subtitle: string;
  lines: string[];
  imageSrc: string;
  imageAlt: string;
  reverse: boolean;
};

const featureBlocks: FeatureBlock[] = [
  {
    id: "feature-leave-calendar",
    number: "01",
    headline: "Leave calendar",
    subtitle: "See who's off, any day of the month.",
    lines: [
      "Scan the month and spot who is out before you schedule",
      "Managers approve requests without chasing status in chat",
      "Everyone sees the same calendar — no duplicate spreadsheets",
    ],
    imageSrc: ASSETS.leave,
    imageAlt: "Coros leave calendar showing team time off",
    reverse: false,
  },
  {
    id: "feature-org-chart",
    number: "02",
    headline: "Org chart",
    subtitle: "Your org structure, always accurate.",
    lines: [
      "Reporting lines and teams stay current as you grow",
      "Jump from the chart to real people and roles in one click",
      "New hires see where they fit on day one",
    ],
    imageSrc: ASSETS.orgChart,
    imageAlt: "Coros org chart visualization",
    reverse: true,
  },
  {
    id: "feature-employee-profiles",
    number: "03",
    headline: "Employee profiles",
    subtitle: "Every person, one place.",
    lines: [
      "Directory fields, departments, and contact info in sync",
      "Self-serve updates reduce back-and-forth with HR",
      "Profiles tie into leave, projects, and permissions",
    ],
    imageSrc: ASSETS.employees,
    imageAlt: "Coros employee profile and directory",
    reverse: false,
  },
  {
    id: "feature-announcements",
    number: "04",
    headline: "Announcements",
    subtitle: "Keep everyone in the loop.",
    lines: [
      "Company-wide posts that live beside daily work",
      "Reach remote and office teams with the same message",
      'Fewer "did you see the email?" threads',
    ],
    imageSrc: ASSETS.announcements,
    imageAlt: "Coros company announcements",
    reverse: true,
  },
  {
    id: "feature-tasks-kanban",
    number: "05",
    headline: "Tasks & Kanban",
    subtitle: "Work that moves forward.",
    lines: [
      "Boards and lists that match how your team actually ships",
      "Assign owners, dates, and status without leaving Coros",
      "Progress stays visible — not buried in side channels",
    ],
    imageSrc: ASSETS.tasks,
    imageAlt: "Coros tasks and Kanban board",
    reverse: false,
  },
];

function FeatureCopy({ block }: { block: FeatureBlock }) {
  return (
    <div className="flex flex-col justify-center py-20">
      <span className="block font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-400">
        {block.number}
      </span>
      <h3 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900">
        {block.headline}
      </h3>
      <p className="mt-4 text-[15px] leading-relaxed text-zinc-500">
        {block.subtitle}
      </p>
      <ul className="mt-4 space-y-3">
        {block.lines.map((line, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="mt-0.5 shrink-0 text-violet-500">→</span>
            <span className="text-sm leading-relaxed text-zinc-500">{line}</span>
          </li>
        ))}
      </ul>
      <Link
        href={`#${block.id}`}
        className="mt-8 inline-flex w-fit text-sm font-medium text-violet-600 transition-colors hover:text-violet-700"
      >
        Learn more →
      </Link>
    </div>
  );
}

function FeatureImage({
  block,
  priority,
}: {
  block: FeatureBlock;
  priority?: boolean;
}) {
  // Image on the left (reverse) tilts right toward center; image on right tilts left
  const defaultTransform = block.reverse
    ? "perspective(1000px) rotateY(8deg) rotateX(3deg) scale(1.02)"
    : "perspective(1000px) rotateY(-8deg) rotateX(3deg) scale(1.02)";
  const hoverTransform = block.reverse
    ? "perspective(1000px) rotateY(3deg) rotateX(1deg) scale(1.04)"
    : "perspective(1000px) rotateY(-3deg) rotateX(1deg) scale(1.04)";

  return (
    <div className="relative flex items-center justify-center p-8 py-20">
      {/* Soft radial glow behind the card */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(139, 92, 246, 0.07) 0%, transparent 70%)",
        }}
      />

      {/* 3D card */}
      <div
        className="relative w-full overflow-hidden rounded-xl border border-zinc-200 shadow-2xl shadow-zinc-300/50"
        style={{
          transform: defaultTransform,
          transformStyle: "preserve-3d",
          transition: "transform 0.4s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = hoverTransform;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = defaultTransform;
        }}
      >
        <Image
          src={block.imageSrc}
          alt={block.imageAlt}
          width={1200}
          height={780}
          sizes="(min-width: 1024px) 50vw, 100vw"
          unoptimized
          priority={priority}
          className="h-auto w-full object-cover object-top"
        />
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section
      id="features"
      className="border-t border-zinc-100 bg-linear-to-br from-zinc-50 to-white"
    >
      {/* Section intro */}
      <div
        className="landing-container"
        style={{
          paddingTop: "100px",
          paddingBottom: "80px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
          Features
        </p>
        <h2
          className="mt-3 font-semibold text-zinc-900"
          style={{
            fontSize: "clamp(32px, 4vw, 48px)",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            maxWidth: "480px",
          }}
        >
          Everything your
          <br />
          company runs on
        </h2>
      </div>

      {/* Feature rows */}
      <div>
        {featureBlocks.map((block, index) => (
          <div key={block.id} id={block.id} className="border-t border-zinc-100">
            <div className="mx-auto max-w-6xl px-6">
              <div
                className={cn(
                  "grid grid-cols-1 items-center gap-8 lg:gap-12",
                  block.reverse
                    ? "lg:grid-cols-[1.4fr_1fr]"
                    : "lg:grid-cols-[1fr_1.4fr]"
                )}
              >
                {/* Copy column */}
                <div className={cn(block.reverse ? "lg:order-2" : "lg:order-1")}>
                  <FeatureCopy block={block} />
                </div>

                {/* Image column */}
                <div className={cn(block.reverse ? "lg:order-1" : "lg:order-2")}>
                  <FeatureImage block={block} priority={index === 0} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
