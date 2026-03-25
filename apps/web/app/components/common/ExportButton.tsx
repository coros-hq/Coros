import { Download, Loader2 } from 'lucide-react';

import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

export interface ExportButtonProps {
  onExport: () => void;
  label?: string;
  isLoading?: boolean;
  className?: string;
}

export function ExportButton({
  onExport,
  label = 'Export CSV',
  isLoading = false,
  className,
}: ExportButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn('shrink-0 gap-2', className)}
      onClick={onExport}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Download className="h-4 w-4" aria-hidden />
      )}
      {label}
    </Button>
  );
}

