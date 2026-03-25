import { useState } from 'react';
import { format } from 'date-fns';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { htmlToPlainText } from '~/lib/html';
import type { ApiAnnouncement } from '~/services/announcement.service';

const PREVIEW_LEN = 220;

function priorityConfig(priority: ApiAnnouncement['priority']) {
  switch (priority) {
    case 'important':
      return {
        wrap: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100',
        accent: 'border-l-amber-500',
        Icon: AlertTriangle,
      };
    case 'urgent':
      return {
        wrap: 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100',
        accent: 'border-l-red-500',
        Icon: AlertCircle,
      };
    default:
      return {
        wrap: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100',
        accent: 'border-l-blue-500',
        Icon: Info,
      };
  }
}

function authorLabel(a: ApiAnnouncement): string {
  const n = `${a.author?.firstName ?? ''} ${a.author?.lastName ?? ''}`.trim();
  return n || 'Unknown';
}

export interface AnnouncementBannerProps {
  announcement: ApiAnnouncement;
  onDismiss: () => void;
}

export function AnnouncementBanner({
  announcement,
  onDismiss,
}: AnnouncementBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const [exiting, setExiting] = useState(false);
  const cfg = priorityConfig(announcement.priority);
  const Icon = cfg.Icon;
  const plain = htmlToPlainText(announcement.content);
  const needsToggle = plain.length > PREVIEW_LEN;

  const handleDismiss = () => {
    setExiting(true);
    window.setTimeout(() => onDismiss(), 300);
  };

  const created = (() => {
    try {
      return format(new Date(announcement.createdAt), 'MMM d, yyyy');
    } catch {
      return '';
    }
  })();

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border transition-all duration-300 ease-in-out',
        'border-l-4',
        cfg.wrap,
        cfg.accent,
        exiting && 'max-h-0 border-0 py-0 opacity-0',
      )}
    >
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex gap-3">
            <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-semibold leading-tight text-inherit">
                {announcement.title}
              </p>
              <div
                className={cn(
                  'prose prose-sm max-w-none text-inherit [&_a]:text-primary [&_a]:underline',
                  !expanded && needsToggle && 'line-clamp-3',
                )}
                dangerouslySetInnerHTML={{ __html: announcement.content }}
              />
              {needsToggle ? (
                <button
                  type="button"
                  className="text-xs font-medium text-inherit underline underline-offset-2 hover:opacity-90"
                  onClick={() => setExpanded((e) => !e)}
                >
                  {expanded ? 'Show less' : 'Read more'}
                </button>
              ) : null}
              {announcement.imageUrls?.length ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {announcement.imageUrls.slice(0, 4).map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block shrink-0 overflow-hidden rounded-md ring-1 ring-black/10 dark:ring-white/10"
                    >
                      <img
                        src={url}
                        alt=""
                        className="h-14 w-20 object-cover sm:h-16 sm:w-24"
                        loading="lazy"
                      />
                    </a>
                  ))}
                  {announcement.imageUrls.length > 4 ? (
                    <span className="text-xs text-inherit/80">
                      +{announcement.imageUrls.length - 4} more
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
          <div className="text-right text-xs text-inherit/80">
            <p className="font-medium">{authorLabel(announcement)}</p>
            <p className="opacity-80">{created}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-inherit hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Dismiss announcement"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
