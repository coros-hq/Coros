import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckSquare,
  Download,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  User,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { DocumentCard } from '~/components/documents/DocumentCard';
import { EmployeeForm } from '~/components/employees/EmployeeForm';
import { useEmployeeDetail } from '~/hooks/useEmployeeDetail';
import { useEmployeeDocuments } from '~/hooks/useEmployeeDocuments';
import { useEmployees } from '~/hooks/useEmployees';
import { useAuthStore } from '~/stores/auth.store';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '~/lib/utils';
import {
  sanitizeDocumentName,
  type ApiDocument,
} from '~/services/document.service';
import type {
  ApiEmployee,
  CreateEmployeePayload,
  UpdateEmployeePayload,
} from '~/services/employee.service';

function formatDate(d?: string | null): string {
  if (!d) return '—';
  try {
    const date = parseISO(d);
    return isValid(date) ? format(date, 'MMM d, yyyy') : '—';
  } catch {
    return '—';
  }
}

function capitalize(s: string): string {
  if (!s) return '—';
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATUS_CFG: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'border-success/30 bg-success-muted text-success' },
  on_leave: { label: 'On leave', className: 'border-warning/30 bg-warning-muted text-warning' },
  inactive: { label: 'Inactive', className: 'border-muted bg-muted text-muted-foreground' },
  terminated: { label: 'Terminated', className: 'border-destructive/30 bg-destructive-muted text-destructive' },
};

const ROLE_CFG: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  employee: 'Employee',
};

function extractDocErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'Failed to delete document. Please try again.';
}

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('personal');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [docSheetOpen, setDocSheetOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<ApiDocument | null>(
    null
  );
  const [documentToDelete, setDocumentToDelete] = useState<ApiDocument | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    employee,
    leaveBalances,
    tasks,
    isLoading,
    error,
    update,
  } = useEmployeeDetail(id);

  const {
    employees,
    departments,
    positions,
    createDepartment,
    createPosition,
  } = useEmployees();

  const {
    documents,
    isLoading: docsLoading,
    error: docsError,
    isUploading,
    upload,
    remove,
  } = useEmployeeDocuments(id);

  const user = useAuthStore((s) => s.user);
  const canMutate = user?.role === 'admin' || user?.role === 'super_admin';

  const isPdf = (doc: ApiDocument) =>
    doc.mimeType === 'application/pdf' ||
    doc.name.toLowerCase().endsWith('.pdf');
  const isImage = (doc: ApiDocument) =>
    doc.mimeType.startsWith('image/') ||
    /\.(jpe?g|png|webp|gif)$/i.test(doc.name);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && id) {
      void upload(file);
      setDocSheetOpen(false);
      e.target.value = '';
    }
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;
    setDeleteError(null);
    try {
      await remove(documentToDelete.id);
      setDocumentToDelete(null);
    } catch (err) {
      setDeleteError(extractDocErrorMessage(err));
    }
  };

  const handleUpdateSubmit = async (
    values: CreateEmployeePayload | UpdateEmployeePayload
  ) => {
    if (!employee) return;
    const payload: UpdateEmployeePayload = {};
    if (values.firstName !== undefined) payload.firstName = values.firstName;
    if (values.lastName !== undefined) payload.lastName = values.lastName;
    if (values.email !== undefined) payload.email = values.email;
    if (values.phone !== undefined) payload.phone = values.phone;
    if (values.dateOfBirth !== undefined) payload.dateOfBirth = values.dateOfBirth;
    if (values.address !== undefined) payload.address = values.address;
    if (values.departmentId !== undefined) payload.departmentId = values.departmentId;
    if (values.positionId !== undefined) payload.positionId = values.positionId;
    if (values.managerId !== undefined) payload.managerId = values.managerId || undefined;
    if (values.hireDate !== undefined) payload.hireDate = values.hireDate;
    if (values.employmentType !== undefined) payload.employmentType = values.employmentType;
    if (values.status !== undefined) payload.status = values.status;
    await update(payload);
    setSheetOpen(false);
  };

  if (!id) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Invalid employee ID</p>
        <Button asChild variant="link" className="mt-2">
          <Link to="/employees">Back to employees</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">{error ?? 'Employee not found'}</p>
        <Button asChild variant="link" className="mt-2">
          <Link to="/employees">Back to employees</Link>
        </Button>
      </div>
    );
  }

  const fullName = `${employee.firstName} ${employee.lastName}`.trim() || '—';
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
  const statusKey = (employee.status ?? 'active').toLowerCase();
  const statusCfg = STATUS_CFG[statusKey] ?? STATUS_CFG.active;
  const roleLabel = ROLE_CFG[employee.user?.role ?? 'employee'] ?? 'Employee';

  return (
    <div className="p-6 lg:p-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 gap-2 text-muted-foreground hover:text-foreground"
        asChild
      >
        <Link to="/employees">
          <ArrowLeft className="size-4" />
          Back to employees
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-primary ring-offset-2 ring-offset-background">
            <AvatarFallback className="bg-muted text-xl font-semibold text-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {fullName}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                {roleLabel}
              </Badge>
              <Badge
                variant="outline"
                className={cn('text-xs', statusCfg.className)}
              >
                {statusCfg.label}
              </Badge>
            </div>
          </div>
        </div>
        {canMutate && (
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => setSheetOpen(true)}
          >
            <Pencil className="size-4" />
            Edit
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="personal" className="gap-2">
            <User className="size-4" />
            Personal info
          </TabsTrigger>
          <TabsTrigger value="work" className="gap-2">
            <Briefcase className="size-4" />
            Work info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact & personal details</CardTitle>
              <CardDescription>Email, phone, date of birth, address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">
                    {employee.user?.email ?? '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">
                    {employee.phone ?? '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Date of birth</p>
                  <p className="font-medium text-foreground">
                    {formatDate(employee.dateOfBirth)}
                  </p>
                </div>
              </div>
              {employee.address ? (
                <div className="flex items-center gap-3">
                  <MapPin className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="font-medium text-foreground">
                      {employee.address}
                    </p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Work details</CardTitle>
              <CardDescription>
                Department, position, manager, hire date
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between gap-4">
                <span className="text-sm text-muted-foreground">Department</span>
                <span className="font-medium text-foreground">
                  {employee.department?.name ?? '—'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-sm text-muted-foreground">Position</span>
                <span className="font-medium text-foreground">
                  {employee.position?.name ?? '—'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-sm text-muted-foreground">Manager</span>
                <span className="font-medium text-foreground">
                  {employee.manager
                    ? `${employee.manager.firstName} ${employee.manager.lastName}`.trim()
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-sm text-muted-foreground">Hire date</span>
                <span className="font-medium text-foreground">
                  {formatDate(employee.hireDate)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-sm text-muted-foreground">Employment type</span>
                <span className="font-medium text-foreground">
                  {capitalize(employee.employmentType ?? '')}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Leave balances */}
      {leaveBalances.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-4" />
              Leave balances
            </CardTitle>
            <CardDescription>Remaining days per leave type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {leaveBalances.map((bal) => {
                const pct =
                  bal.total > 0 ? (bal.remaining / bal.total) * 100 : 0;
                return (
                  <div key={bal.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize text-foreground">
                        {bal.type.replace(/_/g, ' ')}
                      </span>
                      <span className="font-medium text-foreground">
                        {bal.remaining} / {bal.total} days
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assigned tasks */}
      {tasks.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="size-4" />
              Assigned tasks
            </CardTitle>
            <CardDescription>
              Tasks across all projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {tasks.map((task) => {
                const project = task.project as { id?: string; name?: string } | undefined;
                return (
                  <li key={task.id}>
                    <Link
                      to={`/projects/${task.projectId}/tasks`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-left transition-colors hover:bg-accent/10"
                    >
                      <span className="font-medium text-foreground">
                        {task.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {project?.name ?? 'Project'} · {task.priority} ·{' '}
                        {formatDate(task.dueDate)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-4" />
                Documents
              </CardTitle>
              <CardDescription>
                Files attached to this employee
              </CardDescription>
            </div>
            {canMutate && (
              <Button
                size="sm"
                onClick={() => setDocSheetOpen(true)}
                disabled={isUploading}
              >
                + Add contract
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {docsError ? (
            <p className="text-sm text-destructive">{docsError}</p>
          ) : docsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents attached to this employee.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  canMutate={canMutate}
                  onPreview={() => setPreviewDocument(doc)}
                  onDownload={() =>
                    window.open(doc.url, '_blank', 'noopener')
                  }
                  onDelete={() => setDocumentToDelete(doc)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={!!previewDocument}
        onOpenChange={(open) => !open && setPreviewDocument(null)}
      >
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col gap-0 sm:max-w-2xl"
        >
          {previewDocument ? (
            <>
              <SheetHeader className="shrink-0">
                <SheetTitle className="pr-8">
                  {sanitizeDocumentName(previewDocument.name)}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex flex-1 flex-col overflow-hidden rounded-lg border bg-muted/30">
                {isPdf(previewDocument) ? (
                  <iframe
                    title={previewDocument.name}
                    src={previewDocument.url}
                    className="h-full min-h-[400px] w-full flex-1"
                  />
                ) : isImage(previewDocument) ? (
                  <img
                    src={previewDocument.url}
                    alt={previewDocument.name}
                    className="mx-auto max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Preview not available for this file type.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(previewDocument.url, '_blank', 'noopener')
                      }
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Open in new tab
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={docSheetOpen} onOpenChange={setDocSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add contract</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              aria-label="Choose file"
            />
            <Button
              className="w-full"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading…' : 'Choose file'}
            </Button>
            <p className="text-xs text-muted-foreground">
              PDF, Word, Excel, or images. Max 10 MB. This will be linked to{' '}
              {fullName}.
            </p>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!documentToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setDocumentToDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              {documentToDelete
                ? sanitizeDocumentName(documentToDelete.name)
                : ''}
              ? This action cannot be undone.
              {deleteError ? (
                <span className="mt-2 block text-destructive">
                  {deleteError}
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit employee</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <EmployeeForm
              mode="edit"
              employee={employee}
              departments={departments}
              positions={positions}
              employees={employees}
              createDepartment={createDepartment}
              createPosition={createPosition}
              onSubmit={handleUpdateSubmit}
              onCancel={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
