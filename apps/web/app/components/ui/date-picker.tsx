import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Button } from '~/components/ui/button';
import { Calendar } from '~/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { cn } from '~/lib/utils';

function parseIsoDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  className,
}: {
  value?: string;
  onChange: (next?: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const selected = parseIsoDate(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !selected && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {selected ? format(selected, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : undefined)}
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  );
}