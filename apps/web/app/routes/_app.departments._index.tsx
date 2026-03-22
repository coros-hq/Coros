import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Building2 } from 'lucide-react';

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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import { DepartmentCard } from '~/components/departments/DepartmentCard';
import { DepartmentForm } from '~/components/departments/DepartmentForm';
import { useDepartments } from '~/hooks/useDepartments';
import { useAuthStore } from '~/stores/auth.store';
import type { ApiDepartment } from '~/services/department.service';

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'Failed to delete department. Please try again.';
}

export default function DepartmentsIndexPage() {
  const navigate = useNavigate();
  const headerPortal = useRef<Element | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState<ApiDepartment | null>(null);
  const [departmentToDelete, setDepartmentToDelete] =
    useState<ApiDepartment | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { departments, employees, isLoading, error, create, update, remove } =
    useDepartments();

  const user = useAuthStore((s) => s.user);
  const canMutate = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    headerPortal.current = document.getElementById('page-header');
    setPortalReady(true);
  }, []);

  const handleCreateSubmit = async (values: {
    name: string;
    color: string;
    managerId?: string;
  }) => {
    await create({ name: values.name, color: values.color });
    setSheetOpen(false);
  };

  const handleUpdateSubmit = async (values: {
    name: string;
    color: string;
    managerId?: string;
  }) => {
    if (!editingDepartment) return;
    await update(editingDepartment.id, {
      name: values.name,
      color: values.color,
    });
    setEditingDepartment(null);
    setSheetOpen(false);
  };

  const handleSheetClose = (open: boolean) => {
    if (!open) {
      setEditingDepartment(null);
    }
    setSheetOpen(open);
  };

  const handleDeleteConfirm = async () => {
    if (!departmentToDelete) return;
    setDeleteError(null);
    try {
      await remove(departmentToDelete.id);
      setDepartmentToDelete(null);
    } catch (err) {
      setDeleteError(extractErrorMessage(err));
    }
  };

  const totalEmployees = employees.length;
  const departmentsWithoutManager = departments.filter(
    (d) => !d.manager
  ).length;

  return (
    <>
      {portalReady && headerPortal.current
        ? createPortal(
            <div className="flex w-full items-center justify-between">
              <h1 className="text-lg font-bold text-foreground">Departments</h1>
              {canMutate && (
                <Button
                  className="bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setEditingDepartment(null);
                    setSheetOpen(true);
                  }}
                >
                  + Add department
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
                <p className="text-sm text-muted-foreground">
                  Total departments
                </p>
                <p className="text-2xl font-semibold text-foreground">
                  {departments.length}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Total employees</p>
                <p className="text-2xl font-semibold text-foreground">
                  {totalEmployees}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">
                  Departments without a manager
                </p>
                <p className="text-2xl font-semibold text-foreground">
                  {departmentsWithoutManager}
                </p>
              </div>
            </div>

            {departments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Building2 className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  No departments yet
                </p>
                <p className="mb-4 text-sm text-muted-foreground">
                  Create your first department to get started
                </p>
                {canMutate && (
                  <Button onClick={() => setSheetOpen(true)}>
                    + Add department
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {departments.map((dept) => (
                  <DepartmentCard
                    key={dept.id}
                    department={dept}
                    canMutate={canMutate}
                    onEdit={() => {
                      setEditingDepartment(dept);
                      setSheetOpen(true);
                    }}
                    onDelete={() => setDepartmentToDelete(dept)}
                    onClick={() => navigate(`/departments/${dept.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editingDepartment ? 'Edit department' : 'Add department'}
            </SheetTitle>
          </SheetHeader>
          <DepartmentForm
            mode={editingDepartment ? 'edit' : 'create'}
            department={editingDepartment ?? undefined}
            employees={employees}
            onSubmit={
              editingDepartment ? handleUpdateSubmit : handleCreateSubmit
            }
            onCancel={() => handleSheetClose(false)}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!departmentToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setDepartmentToDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {departmentToDelete?.name}? This
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
