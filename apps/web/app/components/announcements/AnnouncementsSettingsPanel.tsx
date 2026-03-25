import { useCallback, useEffect, useRef, useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import {
  Building2,
  ImagePlus,
  Loader2,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { z } from 'zod';

import { RichTextEditor } from '~/components/editor/RichTextEditor';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Field, FieldGroup, FieldLabel } from '~/components/ui/field';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import { DatePicker } from '~/components/ui/date-picker';
import { htmlToPlainText } from '~/lib/html';
import { uploadDocument } from '~/services/document.service';
import { getAll as getAllDepartments } from '~/services/department.service';
import { listEmployees } from '~/services/employee.service';
import type { ApiEmployee } from '~/services/employee.service';
import {
  announcementService,
  type ApiAnnouncement,
} from '~/services/announcement.service';
import { PriorityBadge } from './PriorityBadge';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z
    .string()
    .refine((s) => htmlToPlainText(s).length > 0, 'Content is required'),
  priority: z.enum(['normal', 'important', 'urgent']),
  expiresAt: z.string().optional(),
  imageUrls: z.array(z.string()),
  targetUserIds: z.array(z.string()),
  targetDepartmentIds: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

function toIsoDateOnly(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  try {
    const d = parseISO(iso);
    if (!isValid(d)) return undefined;
    return format(d, 'yyyy-MM-dd');
  } catch {
    return undefined;
  }
}

function formatDisplayDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    const d = parseISO(iso);
    return isValid(d) ? format(d, 'MMM d, yyyy') : '—';
  } catch {
    return '—';
  }
}

function authorName(a: ApiAnnouncement): string {
  const n = `${a.author?.firstName ?? ''} ${a.author?.lastName ?? ''}`.trim();
  return n || '—';
}

function targetingSummary(a: ApiAnnouncement): string {
  const nu = a.targetUsers?.length ?? a.targetUserIds?.length ?? 0;
  const nd =
    a.targetDepartments?.length ?? a.targetDepartmentIds?.length ?? 0;
  if (nu === 0 && nd === 0) return 'Everyone in the organization';
  const parts: string[] = [];
  if (nd) parts.push(`${nd} department${nd === 1 ? '' : 's'}`);
  if (nu) parts.push(`${nu} person${nu === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

const emptyForm = (): FormValues => ({
  title: '',
  content: '',
  priority: 'normal',
  expiresAt: undefined,
  imageUrls: [],
  targetUserIds: [],
  targetDepartmentIds: [],
});

function employeeLabel(e: ApiEmployee): string {
  const n = `${e.firstName} ${e.lastName}`.trim();
  const uid = e.user?.id;
  if (!uid) return `${n} (no login)`;
  return n;
}

export function AnnouncementsSettingsPanel({
  hideHeaderTitle = false,
}: {
  hideHeaderTitle?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [list, setList] = useState<ApiAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ApiAnnouncement | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [departments, setDepartments] = useState<
    Awaited<ReturnType<typeof getAllDepartments>>
  >([]);
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await announcementService.getAll();
      setList(data);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAllDepartments(), listEmployees()])
      .then(([depts, emps]) => {
        if (!cancelled) {
          setDepartments(depts);
          setEmployees(emps.filter((e) => e.user?.id));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDepartments([]);
          setEmployees([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFieldErrors({});
    setApiError(null);
    setSheetOpen(true);
  };

  const openEdit = (a: ApiAnnouncement) => {
    setEditingId(a.id);
    setForm({
      title: a.title,
      content: a.content,
      priority: a.priority,
      expiresAt: toIsoDateOnly(a.expiresAt),
      imageUrls: a.imageUrls ?? [],
      targetUserIds: a.targetUserIds ?? [],
      targetDepartmentIds: a.targetDepartmentIds ?? [],
    });
    setFieldErrors({});
    setApiError(null);
    setSheetOpen(true);
  };

  const handleImagePick = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadingImage(true);
    setApiError(null);
    try {
      const next: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const doc = await uploadDocument(file);
        next.push(doc.url);
      }
      if (next.length) {
        setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, ...next] }));
      }
    } catch (e: unknown) {
      setApiError(
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Image upload failed',
      );
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      const err = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        title: err.title?.[0],
        content: err.content?.[0],
        priority: err.priority?.[0],
        expiresAt: err.expiresAt?.[0],
        imageUrls: err.imageUrls?.[0],
        targetUserIds: err.targetUserIds?.[0],
        targetDepartmentIds: err.targetDepartmentIds?.[0],
      });
      return;
    }
    setSubmitting(true);
    setApiError(null);
    try {
      const payload = {
        title: parsed.data.title,
        content: parsed.data.content,
        priority: parsed.data.priority,
        expiresAt: parsed.data.expiresAt,
        imageUrls: parsed.data.imageUrls,
        targetUserIds: parsed.data.targetUserIds,
        targetDepartmentIds: parsed.data.targetDepartmentIds,
      };
      if (editingId) {
        await announcementService.update(editingId, payload);
      } else {
        await announcementService.create(payload);
      }
      setSheetOpen(false);
      setEditingId(null);
      setForm(emptyForm());
      await load();
    } catch (e: unknown) {
      setApiError(
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Failed to save',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const requestDelete = (a: ApiAnnouncement) => {
    setPendingDelete(a);
  };

  const performDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await announcementService.remove(pendingDelete.id);
      setPendingDelete(null);
      await load();
    } catch {
      /* optional toast */
    } finally {
      setDeleting(false);
    }
  };

  const deptName = (id: string) =>
    departments.find((d) => d.id === id)?.name ?? id;
  const userName = (userId: string) => {
    const e = employees.find((x) => x.user?.id === userId);
    return e ? employeeLabel(e) : userId;
  };

  const availableDeptIds = departments
    .map((d) => d.id)
    .filter((id) => !form.targetDepartmentIds.includes(id));
  const availableEmployees = employees.filter(
    (e) => e.user?.id && !form.targetUserIds.includes(e.user.id),
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void handleImagePick(e.target.files)}
      />

      <div
        className={
          hideHeaderTitle
            ? 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end'
            : 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'
        }
      >
        {hideHeaderTitle ? null : (
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Announcements
            </h2>
            <p className="text-xs text-muted-foreground">
              Create and manage organization-wide announcements
            </p>
          </div>
        )}
        <Button type="button" size="sm" onClick={openNew}>
          <Plus className="mr-1.5 h-4 w-4" />
          New announcement
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : list.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Megaphone className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              No announcements yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create one to reach your team
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <Card key={a.id} className="flex h-full flex-col">
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <CardTitle className="text-sm font-semibold leading-tight">
                    {a.title}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {formatDisplayDate(a.createdAt)} · {authorName(a)}
                    {a.expiresAt ? (
                      <> · Expires {formatDisplayDate(a.expiresAt)}</>
                    ) : null}
                  </CardDescription>
                  <p className="text-[11px] text-muted-foreground">
                    {targetingSummary(a)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <PriorityBadge priority={a.priority} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Announcement actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(a)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => requestDelete(a)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-muted-foreground">
                  {typeof a.readCount === 'number' ? (
                    <>
                      <span className="font-medium text-foreground">
                        {a.readCount}
                      </span>{' '}
                      reads
                    </>
                  ) : (
                    '—'
                  )}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
            setDeleting(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? (
                <>
                  Delete &quot;{pendingDelete.title}&quot;? This cannot be
                  undone.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void performDelete()}
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o);
          if (!o) {
            setEditingId(null);
            setForm(emptyForm());
            setFieldErrors({});
            setApiError(null);
          }
        }}
      >
        <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>
              {editingId ? 'Edit announcement' : 'New announcement'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex flex-1 flex-col gap-4">
            <FieldGroup className="gap-3">
              <Field>
                <FieldLabel htmlFor="ann-title">Title</FieldLabel>
                <Input
                  id="ann-title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Title"
                />
                {fieldErrors.title ? (
                  <p className="mt-1 text-xs text-destructive">
                    {fieldErrors.title}
                  </p>
                ) : null}
              </Field>
              <Field>
                <FieldLabel>Content</FieldLabel>
                <RichTextEditor
                  content={form.content}
                  onChange={(html) =>
                    setForm((f) => ({ ...f, content: html }))
                  }
                  placeholder="Write the announcement…"
                  showToolbar
                  minHeight="160px"
                />
                {fieldErrors.content ? (
                  <p className="mt-1 text-xs text-destructive">
                    {fieldErrors.content}
                  </p>
                ) : null}
              </Field>

              <Field>
                <FieldLabel>Images</FieldLabel>
                <p className="mb-2 text-xs text-muted-foreground">
                  Optional — upload images to show with this announcement.
                </p>
                <div className="flex flex-wrap gap-2">
                  {form.imageUrls.map((url) => (
                    <div
                      key={url}
                      className="relative h-20 w-20 overflow-hidden rounded-md border border-border bg-muted"
                    >
                      <img
                        alt=""
                        className="h-full w-full object-cover"
                        src={url}
                      />
                      <button
                        type="button"
                        className="absolute right-0.5 top-0.5 rounded bg-background/90 p-0.5 shadow"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            imageUrls: f.imageUrls.filter((u) => u !== url),
                          }))
                        }
                        aria-label="Remove image"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-20 w-20 flex-col gap-1 border-dashed"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <ImagePlus className="h-5 w-5" />
                        <span className="text-[10px]">Add</span>
                      </>
                    )}
                  </Button>
                </div>
              </Field>

              <Field>
                <FieldLabel>Audience</FieldLabel>
                <p className="mb-2 text-xs text-muted-foreground">
                  Leave both lists empty to send to{' '}
                  <span className="font-medium text-foreground">
                    everyone
                  </span>{' '}
                  in the organization. Otherwise, only selected people and
                  people in selected departments will see it and get a
                  notification.
                </p>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">
                      Departments
                    </span>
                  </div>
                  {form.targetDepartmentIds.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {form.targetDepartmentIds.map((id) => (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="gap-1 pr-1 font-normal"
                        >
                          {deptName(id)}
                          <button
                            type="button"
                            className="rounded-sm p-0.5 hover:bg-muted"
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                targetDepartmentIds: f.targetDepartmentIds.filter(
                                  (x) => x !== id,
                                ),
                              }))
                            }
                            aria-label={`Remove ${deptName(id)}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {availableDeptIds.length > 0 ? (
                    <Select
                      key={`dept-${form.targetDepartmentIds.join(',')}`}
                      onValueChange={(v) => {
                        setForm((f) => ({
                          ...f,
                          targetDepartmentIds: [...f.targetDepartmentIds, v],
                        }));
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Add department…" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDeptIds.map((id) => (
                          <SelectItem key={id} value={id}>
                            {deptName(id)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">
                      People
                    </span>
                  </div>
                  {form.targetUserIds.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {form.targetUserIds.map((uid) => (
                        <Badge
                          key={uid}
                          variant="secondary"
                          className="gap-1 pr-1 font-normal"
                        >
                          {userName(uid)}
                          <button
                            type="button"
                            className="rounded-sm p-0.5 hover:bg-muted"
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                targetUserIds: f.targetUserIds.filter(
                                  (x) => x !== uid,
                                ),
                              }))
                            }
                            aria-label="Remove"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {availableEmployees.length > 0 ? (
                    <Select
                      key={`usr-${form.targetUserIds.join(',')}`}
                      onValueChange={(v) => {
                        setForm((f) => ({
                          ...f,
                          targetUserIds: [...f.targetUserIds, v],
                        }));
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Add person…" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableEmployees.map((e) => (
                          <SelectItem key={e.id} value={e.user!.id}>
                            {employeeLabel(e)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>
              </Field>

              <Field>
                <FieldLabel>Priority</FieldLabel>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      priority: v as FormValues['priority'],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Expires at (optional)</FieldLabel>
                <DatePicker
                  value={form.expiresAt}
                  onChange={(next) =>
                    setForm((f) => ({ ...f, expiresAt: next }))
                  }
                  placeholder="No expiry"
                />
              </Field>
            </FieldGroup>
            {apiError ? (
              <p className="text-sm text-destructive" role="alert">
                {apiError}
              </p>
            ) : null}
          </div>
          <SheetFooter className="mt-6 gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSheetOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {editingId ? 'Save' : 'Create'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
