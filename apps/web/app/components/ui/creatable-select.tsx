import * as React from 'react';
import { Button } from '~/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '~/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { ShoppingCartIcon, CheckIcon, Loader2Icon } from 'lucide-react';
import { cn } from '~/lib/utils';

export interface CreatableSelectOption {
  value: string;
  label: string;
}

export interface CreatableSelectProps {
  options: CreatableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onCreate?: (
    name: string,
    color?: string
  ) => Promise<CreatableSelectOption | null>;
  showColorPicker?: boolean;
  createLabel?: string;
  id?: string;
}

const matches = (str: string, query: string, exact = false) =>
  exact
    ? str.toLowerCase() === query.toLowerCase()
    : str.toLowerCase().includes(query.toLowerCase());

const DEFAULT_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#eab308', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
];

export function CreatableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  onCreate,
  showColorPicker = false,
  createLabel = 'option',
  id,
}: CreatableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [createName, setCreateName] = React.useState('');
  const [createColor, setCreateColor] = React.useState(DEFAULT_COLORS[0]);
  const [isCreating, setIsCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  const displayLabel =
    options.find((o) => o.value === value)?.label ?? value ?? placeholder;

  const canCreate =
    onCreate &&
    query.trim() &&
    !options.some((o) => matches(o.label, query.trim(), true));

  const handleCreateClick = () => {
    setCreateName(query.trim());
    setCreateColor(DEFAULT_COLORS[0]);
    setCreateError(null);
    setCreateDialogOpen(true);
    setOpen(false);
  };

  const handleCreateConfirm = async () => {
    if (!onCreate || !createName.trim()) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      const result = await onCreate(
        createName.trim(),
        showColorPicker ? createColor : undefined
      );
      if (result) {
        onChange(result.value);
        setCreateDialogOpen(false);
        setQuery('');
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to create';
      setCreateError(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateCancel = () => {
    setCreateDialogOpen(false);
    setCreateName('');
    setCreateError(null);
    setOpen(true);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {displayLabel}
            {/* < className="ml-2 h-4 w-4 shrink-0 opacity-50" /> */}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 min-w-[var(--radix-popover-trigger-width)] max-h-[calc(var(--radix-popover-content-available-height)-2rem)] overflow-auto"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search..."
              className="h-9"
            />
            <CommandList>
              <CommandGroup>
                {canCreate && (
                  <CommandItem
                    value={`create:${query.trim()}`}
                    onSelect={handleCreateClick}
                    className="cursor-pointer"
                  >
                    Create &quot;{query.trim()}&quot;
                  </CommandItem>
                )}
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                      setQuery('');
                    }}
                  >
                    {option.label}
                    <CheckIcon
                      className={cn(
                        'ml-auto h-4 w-4',
                        value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={createDialogOpen} onOpenChange={(o) => !o && handleCreateCancel()}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => {
            if (isCreating) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (isCreating) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Create {createLabel}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {createError && (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {createError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={`Enter ${createLabel} name`}
                disabled={isCreating}
              />
            </div>
            {showColorPicker && (
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={cn(
                        'h-8 w-8 rounded-full border-2 transition-colors',
                        createColor === c
                          ? 'border-foreground ring-2 ring-offset-2 ring-offset-background'
                          : 'border-transparent hover:border-muted-foreground/50'
                      )}
                      style={{ backgroundColor: c }}
                      onClick={() => setCreateColor(c)}
                      aria-label={`Select color ${c}`}
                    />
                  ))}
                  <label
                    className="block h-8 w-8 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/50 hover:border-muted-foreground"
                    style={{ backgroundColor: createColor }}
                  >
                    <input
                      type="color"
                      value={createColor}
                      onChange={(e) => setCreateColor(e.target.value)}
                      className="h-full w-full cursor-pointer border-0 p-0 opacity-0"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCreateCancel}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateConfirm}
              disabled={!createName.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
