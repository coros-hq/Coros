import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';

import { Card, CardContent } from '~/components/ui/card';
import { cn } from '~/lib/utils';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  /** Optional text color for the value (e.g. destructive for errors). */
  valueClassName?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  valueClassName,
}: MetricCardProps) {
  const positive = trend !== undefined && trend.value >= 0;

  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {title}
            </p>
            <p
              className={cn(
                'text-2xl font-bold tracking-tight text-foreground',
                valueClassName,
              )}
            >
              {value}
            </p>
            {subtitle ? (
              <p className="text-xs leading-snug text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
            {trend ? (
              <div
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium',
                  positive
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-500/10 text-red-700 dark:text-red-400',
                )}
              >
                {positive ? (
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" aria-hidden />
                )}
                <span>
                  {positive ? '+' : ''}
                  {trend.value}% {trend.label}
                </span>
              </div>
            ) : null}
          </div>
          <div className="rounded-md bg-muted p-1.5 text-muted-foreground">
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
