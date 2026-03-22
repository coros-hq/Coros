import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Button } from '~/components/ui/button';
import { Calendar } from '~/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { cn } from '~/lib/utils';

function parseIsoDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return isNaN(date.getTime()) ? undefined : date;
}

export interface DatePickerProps {
  value?: string;
  onChange?: (next?: string) => void;
  selected?: Date;
  onSelect?: (date?: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  fromDate?: Date;
  toDate?: Date;
  displayFormat?: string;
}

export function DatePicker({
  value,
  onChange,
  selected,
  onSelect,
  placeholder = 'Pick a date',
  disabled = false,
  className,
  fromDate,
  toDate,
  displayFormat = 'PPP',
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const resolvedDate = selected ?? parseIsoDate(value);

  function handleSelect(date: Date | undefined) {
    if (onSelect) onSelect(date);
    if (onChange) onChange(date ? format(date, 'yyyy-MM-dd') : undefined);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !resolvedDate && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {resolvedDate
            ? format(resolvedDate, displayFormat)
            : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto overflow-hidden p-0"
        sideOffset={4}
      >
        <Calendar
          mode="single"
          selected={resolvedDate}
          onSelect={handleSelect}
          captionLayout="dropdown"
          fromDate={fromDate}
          toDate={toDate}
          defaultMonth={resolvedDate}
        />
      </PopoverContent>
    </Popover>
  );
}