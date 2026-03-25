import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';

import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import type { ApiTaskComment } from '~/services/task.service';

function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 45) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function displayName(comment: ApiTaskComment): string {
  const { firstName, lastName, email } = comment.author;
  const full = `${firstName ?? ''} ${lastName ?? ''}`.trim();
  if (full) return full;
  return email;
}

function initials(comment: ApiTaskComment): string {
  const { firstName, lastName, email } = comment.author;
  if (firstName || lastName) {
    const a = firstName?.[0] ?? '';
    const b = lastName?.[0] ?? '';
    const pair = `${a}${b}`.trim();
    if (pair) return pair.toUpperCase().slice(0, 2);
  }
  return email?.[0]?.toUpperCase() ?? '?';
}

export interface TaskCommentProps {
  comment: ApiTaskComment;
  canDelete: boolean;
  onDelete: (commentId: string) => void;
}

export function TaskComment({ comment, canDelete, onDelete }: TaskCommentProps) {
  const [busy, setBusy] = useState(false);
  const name = useMemo(() => displayName(comment), [comment]);
  const time = useMemo(() => formatTimeAgo(comment.createdAt), [comment.createdAt]);

  return (
    <div className="group relative flex gap-3 rounded-lg border border-transparent px-1 py-2 hover:border-border hover:bg-muted/30">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-[10px]">{initials(comment)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium text-foreground">{name}</span>
          <span className="text-[11px] text-muted-foreground">{time}</span>
        </div>
        <div
          className="prose prose-sm mt-1 max-w-none text-foreground [&_a]:text-primary [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: comment.content }}
        />
      </div>
      {canDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'absolute right-1 top-1 h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100',
            busy && 'opacity-100'
          )}
          disabled={busy}
          aria-label="Delete comment"
          onClick={() => {
            setBusy(true);
            void Promise.resolve(onDelete(comment.id)).finally(() =>
              setBusy(false)
            );
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
