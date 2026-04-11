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

function FeatureCopy({
  block,
  isReverse,
}: {
  block: FeatureBlock;
  isReverse: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-center",
        isReverse
          ? "py-[96px] pl-[72px] border-l border-[var(--border)]"
          : "py-[96px] pr-[72px] border-r border-[var(--border)]"
      )}
    >
      <span
        className="mb-10 block text-[11px] font-medium text-[var(--text-tertiary)]"
        style={{ letterSpacing: "0.06em" }}
      >
        {block.number}
      </span>
      <h3
        className="mb-2.5 font-semibold text-[var(--text-primary)]"
        style={{
          fontSize: "28px",
          letterSpacing: "-0.025em",
          lineHeight: 1.2,
        }}
      >
        {block.headline}
      </h3>
      <p
        className="text-[15px] leading-[1.6] text-[var(--text-secondary)]"
        style={{ marginBottom: "28px" }}
      >
        {block.subtitle}
      </p>
      <div>
        {block.lines.map((line, i) => (
          <p
            key={i}
            className="text-[14px] text-[var(--text-tertiary)]"
            style={{ lineHeight: 2.0 }}
          >
            {line}
          </p>
        ))}
      </div>
      <Link
        href={`#${block.id}`}
        className="mt-8 inline-flex items-center gap-1 text-[13px] font-medium text-[var(--accent)] opacity-90 transition-opacity hover:opacity-100"
      >
        Learn more →
      </Link>
    </div>
  );
}

function FeatureImage({
  block,
  isReverse,
  priority,
}: {
  block: FeatureBlock;
  isReverse: boolean;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden flex items-start",
        isReverse ? "justify-end pt-[32px] pr-[32px] pb-0" : "justify-start pt-[32px] pl-[32px] pb-0"
      )}
    >
      <Image
        src={block.imageSrc}
        alt={block.imageAlt}
        width={1200}
        height={780}
        sizes="(min-width: 1024px) 50vw, 100vw"
        unoptimized
        priority={priority}
        className={cn(
          "feature-img w-full h-auto",
          isReverse ? "rounded-tr-[8px]" : "rounded-tl-[8px]"
        )}
      />
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="bg-[var(--bg)]" style={{ borderTop: "1px solid var(--border)" }}>
      {/* Section intro */}
      <div
        className="landing-container"
        style={{
          paddingTop: "100px",
          paddingBottom: "80px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <p
          className="text-[11px] font-medium uppercase text-[var(--text-tertiary)]"
          style={{ letterSpacing: "0.1em" }}
        >
          Features
        </p>
        <h2
          className="mt-3 font-semibold text-[var(--text-primary)]"
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
      <div className="flex flex-col gap-6 py-6">
      {featureBlocks.map((block, index) => (
        <div
          key={block.id}
          id={block.id}
          className="bg-[var(--bg)]"
          style={{ border: "1px solid var(--border)" }}
        >
          <div className="landing-container">
            {/* Mobile: stacked. Desktop: proportional grid */}
            <div
              className={cn(
                "grid grid-cols-1",
                block.reverse
                  ? "lg:grid-cols-[3fr_2fr]"
                  : "lg:grid-cols-[2fr_3fr]"
              )}
            >
              {/* Copy column — always renders second in DOM for alternating */}
              <div
                className={cn(
                  "px-[48px] py-[48px] lg:px-0 lg:py-0",
                  block.reverse ? "lg:order-2" : "lg:order-1"
                )}
              >
                <FeatureCopy block={block} isReverse={block.reverse} />
              </div>

              {/* Image column */}
              <div
                className={cn(
                  "min-h-[280px] lg:min-h-0",
                  block.reverse ? "lg:order-1" : "lg:order-2"
                )}
              >
                <FeatureImage
                  block={block}
                  isReverse={block.reverse}
                  priority={index === 0}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
      </div>
    </section>
  );
}
