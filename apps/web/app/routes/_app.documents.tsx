import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileText, Search } from 'lucide-react';

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
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import { DocumentCard } from '~/components/documents/DocumentCard';
import { useDocuments } from '~/hooks/useDocuments';
import { useAuthStore } from '~/stores/auth.store';
import {
  sanitizeDocumentName,
  type ApiDocument,
} from '~/services/document.service';
import { listEmployees } from '~/services/employee.service';
import type { ApiEmployee } from '~/services/employee.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Label } from '~/components/ui/label';

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'Failed to delete document. Please try again.';
}

export default function DocumentsPage() {
  const headerPortal = useRef<Element | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<ApiDocument | null>(
    null
  );
  const [previewDocument, setPreviewDocument] = useState<ApiDocument | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPdf = (doc: ApiDocument) =>
    doc.mimeType === 'application/pdf' || doc.name.toLowerCase().endsWith('.pdf');
  const isImage = (doc: ApiDocument) =>
    doc.mimeType.startsWith('image/') ||
    /\.(jpe?g|png|webp|gif)$/i.test(doc.name);

  const { documents, isLoading, error, isUploading, upload, remove } =
    useDocuments();
  const user = useAuthStore((s) => s.user);
  const canMutate = user?.role === 'admin' || user?.role === 'super_admin';

  const myContracts = useMemo(
    () => documents.filter((d) => d.employeeId),
    [documents]
  );
  const orgDocuments = useMemo(
    () => documents.filter((d) => !d.employeeId),
    [documents]
  );

  const filteredMyContracts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return myContracts;
    return myContracts.filter((d) => d.name.toLowerCase().includes(q));
  }, [myContracts, search]);
  const filteredOrgDocuments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orgDocuments;
    return orgDocuments.filter((d) => d.name.toLowerCase().includes(q));
  }, [orgDocuments, search]);

  useEffect(() => {
    headerPortal.current = document.getElementById('page-header');
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (canMutate) {
      listEmployees()
        .then(setEmployees)
        .catch(() => setEmployees([]));
    }
  }, [canMutate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void upload(file, selectedEmployeeId || null);
      setSheetOpen(false);
      setSelectedEmployeeId('');
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
      setDeleteError(extractErrorMessage(err));
    }
  };

  return (
    <>
      {portalReady && headerPortal.current
        ? createPortal(
            <div className="flex w-full items-center justify-between">
              <h1 className="text-lg font-bold text-foreground">Documents</h1>
              {canMutate && (
                <Button
                  className="bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  size="sm"
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  disabled={isUploading}
                >
                  + Add document
                </Button>
              )}
            </div>,
            headerPortal.current
          )
        : null}

      <div className="p-6">
        {error ? (
          <div
            className="mb-4 rounded-xl border border-destructive/25 bg-destructive-muted px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {deleteError ? (
          <div
            className="mb-4 rounded-xl border border-destructive/25 bg-destructive-muted px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {deleteError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        ) : (
          <>
            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  No documents yet
                </p>
                <p className="mb-4 text-sm text-muted-foreground">
                  Upload files to share with your organization
                </p>
                {canMutate && (
                  <Button onClick={() => setSheetOpen(true)}>
                    + Add document
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search documents…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                      aria-label="Search documents"
                    />
                  </div>
                </div>

                {filteredMyContracts.length === 0 && filteredOrgDocuments.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No documents match your search.
                  </p>
                ) : (
                  <div className="flex flex-col gap-6">
                    {filteredMyContracts.length > 0 ? (
                      <div>
                        <h2 className="mb-3 text-sm font-semibold text-foreground">
                          {canMutate ? 'Contracts' : 'My contract'}
                        </h2>
                        <div className="flex flex-col gap-3">
                          {filteredMyContracts.map((doc) => (
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
                      </div>
                    ) : null}
                    {filteredOrgDocuments.length > 0 ? (
                      <div>
                        <h2 className="mb-3 text-sm font-semibold text-foreground">
                          {myContracts.length > 0 ? 'Organization documents' : 'Documents'}
                        </h2>
                        <div className="flex flex-col gap-3">
                          {filteredOrgDocuments.map((doc) => (
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
                      </div>
                    ) : null}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add document</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-4">
            {canMutate && employees.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="document-employee">Assign to employee (contract)</Label>
                <Select
                  value={selectedEmployeeId || 'org'}
                  onValueChange={(v) => setSelectedEmployeeId(v === 'org' ? '' : v)}
                >
                  <SelectTrigger id="document-employee">
                    <SelectValue placeholder="Organization document" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="org">Organization document</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                        {emp.department?.name ? ` · ${emp.department.name}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Leave as organization document or select an employee to upload as their contract.
                </p>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>File</Label>
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
                PDF, Word, Excel, or images. Max 10 MB.
              </p>
            </div>
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
              ? This
              action cannot be undone.
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
    </>
  );
}
