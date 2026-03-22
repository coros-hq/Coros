import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { FolderKanban, Search } from 'lucide-react';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import { ProjectCard } from '~/components/projects/ProjectCard';
import { ProjectForm } from '~/components/projects/ProjectForm';
import { useProjects } from '~/hooks/useProjects';
import { useAuthStore } from '~/stores/auth.store';
import { listEmployees } from '~/services/employee.service';
import type { ApiEmployee } from '~/services/employee.service';
import type { ApiProject } from '~/services/project.service';

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'Failed to delete project. Please try again.';
}

export default function ProjectsIndexPage() {
  const navigate = useNavigate();
  const headerPortal = useRef<Element | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ApiProject | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ApiProject | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'planning' | 'active' | 'completed'
  >('all');
  const [sortKey, setSortKey] = useState<'name' | 'date' | 'tasks'>('name');

  const { projects, isLoading, error, create, update, remove } = useProjects();

  const filteredProjects = useMemo(() => {
    let list = [...projects];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter);
    }
    list.sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date': {
          const ta = new Date(a.createdAt ?? a.startDate ?? 0).getTime();
          const tb = new Date(b.createdAt ?? b.startDate ?? 0).getTime();
          return tb - ta;
        }
        case 'tasks':
          return (b.taskCount ?? 0) - (a.taskCount ?? 0);
        default:
          return 0;
      }
    });
    return list;
  }, [projects, search, statusFilter, sortKey]);

  const user = useAuthStore((s) => s.user);
  const canMutate = user?.role === 'admin' || user?.role === 'super_admin';

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

  const handleCreateSubmit = async (values: {
    name: string;
    description?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    memberIds?: string[];
  }) => {
    await create({
      name: values.name,
      description: values.description,
      status: values.status as 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled',
      startDate: values.startDate,
      endDate: values.endDate,
      memberIds: values.memberIds,
    });
    setSheetOpen(false);
  };

  const handleUpdateSubmit = async (values: {
    name: string;
    description?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    if (!editingProject) return;
    await update(editingProject.id, {
      name: values.name,
      description: values.description,
      status: values.status as 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled',
      startDate: values.startDate,
      endDate: values.endDate,
    });
    setEditingProject(null);
    setSheetOpen(false);
  };

  const handleSheetClose = (open: boolean) => {
    if (!open) {
      setEditingProject(null);
    }
    setSheetOpen(open);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    setDeleteError(null);
    try {
      await remove(projectToDelete.id);
      setProjectToDelete(null);
    } catch (err) {
      setDeleteError(extractErrorMessage(err));
    }
  };

  const activeCount = projects.filter((p) => p.status === 'active').length;

  return (
    <>
      {portalReady && headerPortal.current
        ? createPortal(
            <div className="flex w-full items-center justify-between">
              <h1 className="text-lg font-bold text-foreground">Projects</h1>
              {canMutate && (
                <Button
                  className="bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setEditingProject(null);
                    setSheetOpen(true);
                  }}
                >
                  + Add project
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
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Total projects</p>
                <p className="text-2xl font-semibold text-foreground">
                  {projects.length}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Active projects</p>
                <p className="text-2xl font-semibold text-foreground">
                  {activeCount}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Planning</p>
                <p className="text-2xl font-semibold text-foreground">
                  {projects.filter((p) => p.status === 'planning').length}
                </p>
              </div>
            </div>

            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FolderKanban className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  No projects yet
                </p>
                <p className="mb-4 text-sm text-muted-foreground">
                  Create your first project to get started
                </p>
                {canMutate && (
                  <Button onClick={() => setSheetOpen(true)}>
                    + Add project
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <div className="relative max-w-md flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search projects…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                      aria-label="Search projects"
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) =>
                      setStatusFilter(
                        v as 'all' | 'planning' | 'active' | 'completed'
                      )
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={sortKey}
                    onValueChange={(v) =>
                      setSortKey(v as 'name' | 'date' | 'tasks')
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name (A–Z)</SelectItem>
                      <SelectItem value="date">Date (newest)</SelectItem>
                      <SelectItem value="tasks">Task count</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filteredProjects.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No projects match your filters.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((proj) => (
                      <ProjectCard
                        key={proj.id}
                        project={proj}
                        canMutate={canMutate}
                        onEdit={() => {
                          setEditingProject(proj);
                          setSheetOpen(true);
                        }}
                        onDelete={() => setProjectToDelete(proj)}
                        onClick={() => navigate(`/projects/${proj.id}`)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editingProject ? 'Edit project' : 'Add project'}
            </SheetTitle>
          </SheetHeader>
          <ProjectForm
            mode={editingProject ? 'edit' : 'create'}
            project={editingProject ?? undefined}
            employees={employees}
            onSubmit={
              editingProject ? handleUpdateSubmit : handleCreateSubmit
            }
            onCancel={() => handleSheetClose(false)}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setProjectToDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {projectToDelete?.name}? All
              tasks will be deleted. This action cannot be undone.
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
