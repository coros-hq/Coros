import { useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';

import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '~/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { cn } from '~/lib/utils';
import type { ApiEmployee } from '~/services/employee.service';

function employeeDisplayName(emp: ApiEmployee): string {
  const name = `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim();
  return name || 'Unknown';
}

function employeeSearchBlob(emp: ApiEmployee): string {
  const name = employeeDisplayName(emp);
  const email = emp.user?.email ?? '';
  const dept = emp.department?.name ?? '';
  return [name, email, dept].filter(Boolean).join(' ');
}

export interface EmployeeMultiSelectProps {
  employees: ApiEmployee[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function EmployeeMultiSelect({
  employees,
  value,
  onChange,
  disabled = false,
}: EmployeeMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const selectedEmployees = useMemo(
    () => value.map((id) => employees.find((e) => e.id === id)).filter(Boolean) as ApiEmployee[],
    [employees, value]
  );

  function toggle(id: string) {
    if (selectedSet.has(id)) {
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  }

  function remove(id: string) {
    onChange(value.filter((x) => x !== id));
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5',
          disabled && 'pointer-events-none opacity-50'
        )}
      >
        {selectedEmployees.map((emp) => {
          const name = employeeDisplayName(emp);
          const email = emp.user?.email;
          const dept = emp.department?.name;
          const chipLabel = email
            ? `${name} (${email})`
            : name;
          return (
            <Badge
              key={emp.id}
              variant="secondary"
              className="max-w-full gap-1 pr-1 font-normal"
            >
              <span className="truncate" title={dept ? `${chipLabel} — ${dept}` : chipLabel}>
                {chipLabel}
                {dept ? (
                  <span className="ml-1 text-muted-foreground">· {dept}</span>
                ) : null}
              </span>
              <button
                type="button"
                className="ml-0.5 rounded-sm p-0.5 outline-none ring-offset-background hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => remove(emp.id)}
                aria-label={`Remove ${name}`}
              >
                <X className="size-3 shrink-0 opacity-70" />
              </button>
            </Badge>
          );
        })}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground"
              disabled={disabled}
            >
              {value.length === 0 ? 'Select members…' : 'Add more…'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[min(100vw-2rem,22rem)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search name, email, or department…" />
              <CommandList>
                <CommandEmpty>No employee found.</CommandEmpty>
                <CommandGroup>
                  {employees.map((emp) => {
                    const name = employeeDisplayName(emp);
                    const email = emp.user?.email;
                    const dept = emp.department?.name;
                    const isSelected = selectedSet.has(emp.id);
                    const searchValue = employeeSearchBlob(emp);
                    return (
                      <CommandItem
                        key={emp.id}
                        value={searchValue}
                        onSelect={() => {
                          toggle(emp.id);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 size-4 shrink-0',
                            isSelected ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="truncate text-sm">
                            {name}
                            {email ? (
                              <span className="font-normal text-muted-foreground">
                                {' '}
                                ({email})
                              </span>
                            ) : null}
                          </span>
                          {dept ? (
                            <span className="truncate text-xs text-muted-foreground">
                              {dept}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/70">
                              No department
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
