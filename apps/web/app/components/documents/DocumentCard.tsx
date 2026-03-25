import {
  Download,
  FileText,
  FileSpreadsheet,
  Image,
  Trash2,
} from 'lucide-react';

import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  formatFileSize,
  getFileIcon,
  sanitizeDocumentName,
  type ApiDocument,
} from '~/services/document.service';
import { cn } from '~/lib/utils';

const ICON_MAP: Record<string, typeof FileText> = {
  image: Image,
  'file-text': FileText,
  table: FileSpreadsheet,
  file: FileText,
};

export interface DocumentCardProps {
  document: ApiDocument;
  canMutate: boolean;
  /** Show which employee a contract belongs to (managers/admins viewing org-wide list). */
  showEmployeeBadge?: boolean;
  onPreview: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

export function DocumentCard({
  document,
  canMutate,
  showEmployeeBadge = false,
  onPreview,
  onDownload,
  onDelete,
}: DocumentCardProps) {
  const iconType = getFileIcon(document.mimeType);
  const Icon = ICON_MAP[iconType] ?? FileText;
  const displayName = sanitizeDocumentName(document.name);

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50">
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          'bg-muted text-muted-foreground'
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <button
        type="button"
        onClick={onPreview}
        className="min-w-0 flex-1 text-left"
      >
        <span className="block truncate font-medium text-foreground hover:underline">
          {displayName}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {document.employeeId && document.employee && (canMutate || showEmployeeBadge) ? (
            <Badge variant="secondary" className="text-[10px]">
              {document.employee.firstName} {document.employee.lastName}
            </Badge>
          ) : null}
          <span className="text-xs text-muted-foreground">
            {formatFileSize(document.size)}
          </span>
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onDownload}
          aria-label="Download"
        >
          <Download className="h-4 w-4" />
        </Button>
        {canMutate && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
