import { useCallback, useEffect, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { format } from 'date-fns';
import { Loader2, Megaphone } from 'lucide-react';

import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Skeleton } from '~/components/ui/skeleton';
import { cn } from '~/lib/utils';
import {
  announcementService,
  type ApiAnnouncement,
} from '~/services/announcement.service';
import { PriorityBadge } from './PriorityBadge';

function authorLabel(a: ApiAnnouncement): string {
  const n = `${a.author?.firstName ?? ''} ${a.author?.lastName ?? ''}`.trim();
  return n || 'Unknown';
}

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), 'MMM d, yyyy');
  } catch {
    return '';
  }
}

/** True if the event came from a nested control (not the card surface). Do not use `[role="button"]` here — the card itself has that role. */
function isNestedControlClick(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  return Boolean(el.closest('button, a'));
}

export function AnnouncementsFeed() {
  const [items, setItems] = useState<ApiAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ApiAnnouncement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await announcementService.getFeed();
      setItems(data);
    } catch (e: unknown) {
      setError(
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Failed to load announcements',
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleMarkRead = async (id: string) => {
    setMarkingId(id);
    try {
      await announcementService.markAsRead(id);
      setItems((prev) =>
        prev.map((a) => (a.id === id ? { ...a, readByMe: true } : a)),
      );
      setDetail((d) =>
        d?.id === id ? { ...d, readByMe: true } : d,
      );
    } finally {
      setMarkingId(null);
    }
  };

  const openDetail = (a: ApiAnnouncement) => {
    setDetail(a);
  };

  const handleCardClick = (e: MouseEvent, a: ApiAnnouncement) => {
    if (isNestedControlClick(e.target)) return;
    openDetail(a);
  };

  const handleCardKeyDown = (e: KeyboardEvent, a: ApiAnnouncement) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDetail(a);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Megaphone className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            No announcements yet
          </p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            When your organization posts an announcement, it will show up here
            and you&apos;ll get a notification.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => (
          <Card
            key={a.id}
            role="button"
            tabIndex={0}
            className={cn(
              'flex h-full cursor-pointer flex-col overflow-hidden transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              a.readByMe === false && 'border-primary/25 bg-primary/[0.03]',
            )}
            onClick={(e) => handleCardClick(e, a)}
            onKeyDown={(e) => handleCardKeyDown(e, a)}
          >
            <CardHeader className="space-y-2 p-4 pb-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-semibold leading-tight">
                      {a.title}
                    </CardTitle>
                    {a.readByMe === false ? (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                        New
                      </span>
                    ) : null}
                  </div>
                  <CardDescription className="text-xs">
                    {formatDate(a.createdAt)} · {authorLabel(a)}
                    {a.expiresAt ? (
                      <> · Expires {formatDate(a.expiresAt)}</>
                    ) : null}
                  </CardDescription>
                </div>
                <PriorityBadge priority={a.priority} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              <div
                className="prose prose-sm max-w-none text-foreground line-clamp-5 [&_a]:pointer-events-none [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: a.content }}
              />
              {a.imageUrls?.length ? (
                <div className="flex items-center gap-2">
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md border bg-muted">
                    <img
                      src={a.imageUrls[0]}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  {a.imageUrls.length > 1 ? (
                    <span className="text-xs text-muted-foreground">
                      +{a.imageUrls.length - 1} more image
                      {a.imageUrls.length - 1 === 1 ? '' : 's'} in details
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Open for full size
                    </span>
                  )}
                </div>
              ) : null}
              <p className="text-[11px] text-muted-foreground">
                Click to read full announcement
              </p>
              {a.readByMe === false ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={markingId === a.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleMarkRead(a.id);
                  }}
                >
                  {markingId === a.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Mark as read
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
          {detail ? (
            <>
              <DialogHeader className="space-y-1 border-b px-6 py-4 text-left">
                <DialogTitle className="pr-8 text-xl leading-snug">
                  {detail.title}
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span>{formatDate(detail.createdAt)}</span>
                    <span>·</span>
                    <span>{authorLabel(detail)}</span>
                    {detail.expiresAt ? (
                      <>
                        <span>·</span>
                        <span>Expires {formatDate(detail.expiresAt)}</span>
                      </>
                    ) : null}
                    <span className="ml-1 inline-flex">
                      <PriorityBadge priority={detail.priority} />
                    </span>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <div
                  className="prose prose-sm max-w-none text-foreground [&_a]:text-primary [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: detail.content }}
                />
                {detail.imageUrls?.length ? (
                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {detail.imageUrls.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-lg border bg-muted"
                      >
                        <img
                          src={url}
                          alt=""
                          className="max-h-[min(70vh,480px)] w-full object-contain"
                          loading="lazy"
                        />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
              {detail.readByMe === false ? (
                <DialogFooter className="border-t px-6 py-4 sm:justify-start">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={markingId === detail.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleMarkRead(detail.id);
                    }}
                  >
                    {markingId === detail.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Mark as read
                  </Button>
                </DialogFooter>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
