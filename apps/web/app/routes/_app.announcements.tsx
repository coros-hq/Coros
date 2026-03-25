import { Megaphone } from 'lucide-react';

import { AnnouncementsFeed } from '~/components/announcements/AnnouncementsFeed';
import { AnnouncementsSettingsPanel } from '~/components/announcements/AnnouncementsSettingsPanel';
import { useAuthStore } from '~/stores/auth.store';

export default function AnnouncementsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin =
    user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <div className="mx-auto w-full space-y-8 px-4 py-8">
      <div>
        <div className="flex items-center gap-2">
          <Megaphone className="h-7 w-7 text-primary" aria-hidden />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Announcements
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAdmin
            ? 'Create and manage announcements. Everyone in your organization gets a notification when you publish, and active posts also appear as banners on the dashboard.'
            : 'Organization-wide updates. You’ll get a notification when something new is posted.'}
        </p>
      </div>

      {isAdmin ? (
        <AnnouncementsSettingsPanel hideHeaderTitle />
      ) : (
        <AnnouncementsFeed />
      )}
    </div>
  );
}
