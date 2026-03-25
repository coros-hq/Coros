import { useEffect, useState } from 'react';

import { Skeleton } from '~/components/ui/skeleton';
import { announcementService } from '~/services/announcement.service';
import type { ApiAnnouncement } from '~/services/announcement.service';
import { AnnouncementBanner } from './AnnouncementBanner';

export function AnnouncementsList() {
  const [items, setItems] = useState<ApiAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    announcementService
      .getActive()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDismiss = async (id: string) => {
    try {
      await announcementService.markAsRead(id);
    } catch {
      // still remove from UI if read failed — user dismissed
    }
    setItems((prev) => prev.filter((a) => a.id !== id));
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <Skeleton className="mb-3 h-4 w-2/5" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {items.map((a) => (
        <AnnouncementBanner
          key={a.id}
          announcement={a}
          onDismiss={() => void handleDismiss(a.id)}
        />
      ))}
    </div>
  );
}
