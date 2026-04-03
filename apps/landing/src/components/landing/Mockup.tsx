import Image from "next/image";
import mockup from "@/../public/coros-dashboard-mockup.png";

export function Mockup() {
  return (
    <div className="relative mx-auto w-full">
      <div className="overflow-hidden rounded-xl border border-zinc-300/90 bg-white shadow-[0_32px_120px_-24px_rgba(24,24,27,0.18),0_0_0_1px_rgba(24,24,27,0.06)] ring-1 ring-zinc-900/[0.04]">
        <div className="flex items-center gap-2 border-b border-zinc-200/90 bg-zinc-100 px-3 py-2.5">
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="ml-1 min-w-0 flex-1 rounded-md border border-zinc-200/80 bg-white px-3 py-1 text-left text-xs text-zinc-500">
            app.coros.click
          </div>
        </div>

        <div className="bg-zinc-50">
          <Image
            src={mockup}
            alt="Coros admin dashboard with overview, onboarding, metrics, tasks, and leave requests"
            width={3630}
            height={2014}
            className="h-auto w-full"
            sizes="100vw"
            priority
          />
        </div>
      </div>
    </div>
  );
}
