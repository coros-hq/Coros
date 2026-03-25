import { cn } from '~/lib/utils';

export type AnnouncementPriorityValue = 'normal' | 'important' | 'urgent';

const LABELS: Record<AnnouncementPriorityValue, string> = {
  normal: 'Normal',
  important: 'Important',
  urgent: 'Urgent',
};

export function PriorityBadge({
  priority,
  className,
}: {
  priority: AnnouncementPriorityValue;
  className?: string;
}) {
  const styles: Record<AnnouncementPriorityValue, string> = {
    normal:
      'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100',
    important:
      'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100',
    urgent:
      'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
        styles[priority],
        className,
      )}
    >
      {LABELS[priority]}
    </span>
  );
}
