import { useRef, useState } from 'react';
import { FileUp } from 'lucide-react';
import { Button } from '~/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { parseEmployeeImportFile } from '~/lib/employee-import/parse-import';
import { downloadEmployeeImportTemplate } from '~/lib/employee-import/template';
import type { ApiEmployee } from '~/services/employee.service';
import type { ApiDepartment } from '~/services/department.service';
import type { ApiPosition } from '~/services/position.service';
import type { CreateEmployeePayload } from '~/services/employee.service';

const PREVIEW_ROWS = 12;

function errorMessageFromUnknown(e: unknown): string {
  if (e && typeof e === 'object') {
    const o = e as Record<string, unknown>;
    if (typeof o.message === 'string' && o.message) return o.message;
    if (typeof o.error === 'string' && o.error) return o.error;
  }
  return 'Import failed';
}

export interface EmployeeImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: ApiDepartment[];
  positions: ApiPosition[];
  employees: ApiEmployee[];
  /** Create department when the spreadsheet names one that does not exist yet. */
  createDepartment: (name: string, color?: string) => Promise<ApiDepartment>;
  /** Create position under a department when the title does not exist yet. */
  createPosition: (
    departmentId: string,
    name: string,
    description?: string
  ) => Promise<ApiPosition>;
  onImport: (payloads: CreateEmployeePayload[]) => Promise<void>;
}

export function EmployeeImportSheet({
  open,
  onOpenChange,
  departments,
  positions,
  employees,
  createDepartment,
  createPosition,
  onImport,
}: EmployeeImportSheetProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseErrors, setParseErrors] = useState<
    { row: number; message: string }[] | null
  >(null);
  const [payloads, setPayloads] = useState<CreateEmployeePayload[] | null>(
    null
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setFileName(null);
    setParseErrors(null);
    setPayloads(null);
    setSubmitError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleFile = async (file: File | null) => {
    setParseErrors(null);
    setPayloads(null);
    setSubmitError(null);
    if (!file) {
      setFileName(null);
      return;
    }
    setFileName(file.name);
    const result = await parseEmployeeImportFile(file, {
      departments,
      positions,
      employees,
      createDepartmentIfMissing: (name) => createDepartment(name),
      createPositionIfMissing: (departmentId, name) =>
        createPosition(departmentId, name),
    });
    if (!result.ok) {
      setParseErrors(result.errors);
      return;
    }
    setPayloads(result.payloads);
  };

  const handleSubmit = async () => {
    if (!payloads?.length) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onImport(payloads);
      handleClose(false);
    } catch (e: unknown) {
      setSubmitError(errorMessageFromUnknown(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="flex min-h-0 w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <SheetHeader className="shrink-0 border-b px-6 pb-4 pt-6 pr-14 text-left">
          <SheetTitle>Import employees</SheetTitle>
          <p className="text-sm text-muted-foreground">
            Upload an Excel file (.xlsx). Department and position are matched by
            name; if a department or position does not exist yet, it is created
            before employees are imported. The import runs as a single batch: if
            any row fails on the server, no employees are created.
          </p>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadEmployeeImportTemplate()}
            >
              Download template
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <FileUp className="mr-1.5 h-4 w-4" />
              Choose file
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                void handleFile(f);
              }}
            />
          </div>

          {fileName ? (
            <p className="text-sm text-muted-foreground">
              Selected: <span className="text-foreground">{fileName}</span>
            </p>
          ) : null}

          {parseErrors?.length ? (
            <div
              className="rounded-lg border border-destructive/25 bg-destructive-muted px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              <p className="font-medium">Fix these issues in the spreadsheet:</p>
              <ul className="mt-2 list-inside list-disc space-y-0.5">
                {parseErrors.map((err, i) => (
                  <li key={i}>
                    {err.row > 0 ? `Row ${err.row}: ` : ''}
                    {err.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {submitError ? (
            <div
              className="rounded-lg border border-destructive/25 bg-destructive-muted px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {submitError}
            </div>
          ) : null}

          {payloads?.length ? (
            <>
              <p className="text-sm font-medium text-foreground">
                {payloads.length} employee{payloads.length !== 1 ? 's' : ''}{' '}
                ready to import
              </p>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Dept / role
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payloads.slice(0, PREVIEW_ROWS).map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {p.firstName} {p.lastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.email}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {departments.find((d) => d.id === p.departmentId)
                            ?.name ?? '—'}{' '}
                          ·{' '}
                          {positions.find((pos) => pos.id === p.positionId)
                            ?.name ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {payloads.length > PREVIEW_ROWS ? (
                <p className="text-xs text-muted-foreground">
                  Showing first {PREVIEW_ROWS} rows.
                </p>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="shrink-0 border-t px-6 py-4">
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!payloads?.length || submitting}
              onClick={() => void handleSubmit()}
            >
              {submitting ? 'Importing…' : 'Import all'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
