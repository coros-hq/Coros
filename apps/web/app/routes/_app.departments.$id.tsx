import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Briefcase,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserPlus,
  Users,
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
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { DepartmentForm } from '~/components/departments/DepartmentForm';
import { EmployeeForm } from '~/components/employees/EmployeeForm';
import { DEPARTMENT_COLORS } from '~/constants/department-colors';
import { useDepartmentDetail } from '~/hooks/useDepartmentDetail';
import { useAuthStore } from '~/stores/auth.store';
import type { ApiEmployee } from '~/services/employee.service';
import type {
  CreateEmployeePayload,
  UpdateEmployeePayload,
} from '~/services/employee.service';

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'Something went wrong. Please try again.';
}

export default function DepartmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const headerPortal = useRef<Element | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    department,
    employees,
    positions,
    isLoading,
    error,
    update,
    remove,
    allEmployees,
    allDepartments,
    allPositions,
    createEmployee,
    updateEmployee,
    createPosition,
  } = useDepartmentDetail(id);

  const [employeeSheetOpen, setEmployeeSheetOpen] = useState(false);
  const [employeeToMove, setEmployeeToMove] = useState<ApiEmployee | null>(null);
  const [moveDepartmentId, setMoveDepartmentId] = useState<string>('');
  const [movePositionId, setMovePositionId] = useState<string>('');
  const [moveError, setMoveError] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);
  const canMutate = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    headerPortal.current = document.getElementById('page-header');
    setPortalReady(true);
  }, []);

  const handleUpdateSubmit = async (values: {
    name: string;
    color: string;
    managerId?: string;
  }) => {
    if (!department) return;
    await update({ name: values.name, color: values.color });
    setSheetOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!department) return;
    setDeleteError(null);
    try {
      await remove();
      setShowDeleteDialog(false);
      navigate('/departments');
    } catch (err) {
      setDeleteError(extractErrorMessage(err));
    }
  };

  const handleCreateEmployeeSubmit = async (
    values: CreateEmployeePayload | UpdateEmployeePayload
  ) => {
    const payload: CreateEmployeePayload = {
      firstName: values.firstName!,
      lastName: values.lastName!,
      email: values.email!,
      phone: values.phone!,
      departmentId: id!,
      positionId: values.positionId!,
    };
    if (values.managerId) payload.managerId = values.managerId;
    if (values.employmentType) payload.employmentType = values.employmentType;
    if (values.hireDate) payload.hireDate = values.hireDate;
    if (values.dateOfBirth) payload.dateOfBirth = values.dateOfBirth;
    await createEmployee(payload);
    setEmployeeSheetOpen(false);
  };

  const handleMoveSubmit = async () => {
    if (!employeeToMove || !moveDepartmentId || !movePositionId) return;
    setMoveError(null);
    try {
      await updateEmployee(employeeToMove.id, {
        departmentId: moveDepartmentId,
        positionId: movePositionId,
      });
      setEmployeeToMove(null);
      setMoveDepartmentId('');
      setMovePositionId('');
    } catch (err) {
      setMoveError(extractErrorMessage(err));
    }
  };

  const otherDepartments = allDepartments.filter((d) => d.id !== id);
  const movePositions = allPositions.filter(
    (p) => p.department?.id === moveDepartmentId
  );

  const color = department?.color ?? DEPARTMENT_COLORS[0].value;
  const managerLabel = department?.manager
    ? `${department.manager.firstName} ${department.manager.lastName}`
    : 'No manager';

  if (!id) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Invalid department</p>
      </div>
    );
  }

  return (
    <>
      {portalReady && headerPortal.current
        ? createPortal(
            <div className="flex w-full items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Button variant="ghost" size="icon" asChild className="h-8 w-8 shrink-0">
                  <Link to="/departments" aria-label="Back to departments">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div className="flex min-w-0 items-center gap-2">
                  {department ? (
                    <>
                      <span
                        className="h-4 w-4 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <h1 className="truncate text-lg font-bold text-foreground">
                        {department.name}
                      </h1>
                    </>
                  ) : (
                    <h1 className="text-lg font-bold text-foreground">
                      Loading…
                    </h1>
                  )}
                </div>
              </div>
              {canMutate && department && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setSheetOpen(true);
                      }}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={(e) => {
                        e.preventDefault();
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>,
            headerPortal.current
          )
        : null}

      <div className="p-6 lg:p-8">
        {error ? (
          <div
            className="mb-4 rounded-xl border border-destructive/25 bg-destructive-muted px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        ) : department ? (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Manager</p>
                <p className="text-lg font-semibold text-foreground">
                  {managerLabel}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Employees</p>
                <p className="text-2xl font-semibold text-foreground">
                  {employees.length}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Positions</p>
                <p className="text-2xl font-semibold text-foreground">
                  {positions.length}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <Users className="h-4 w-4" />
                    Employees
                  </h2>
                  {canMutate && (
                    <Button
                      size="sm"
                      onClick={() => setEmployeeSheetOpen(true)}
                      className="gap-1.5"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add employee
                    </Button>
                  )}
                </div>
                {employees.length === 0 ? (
                  <div className="rounded-lg border border-dashed bg-muted/30 py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      No employees in this department
                    </p>
                    {canMutate && (
                      <Button
                        variant="link"
                        className="mt-2"
                        onClick={() => setEmployeeSheetOpen(true)}
                      >
                        Add employee
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Email</TableHead>
                          {canMutate ? <TableHead className="w-12" /> : null}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employees.map((emp) => {
                          const initials = `${emp.firstName?.[0] ?? ''}${emp.lastName?.[0] ?? ''}`.toUpperCase();
                          return (
                            <TableRow
                              key={emp.id}
                              className="cursor-pointer"
                              onClick={() => navigate(`/employees/${emp.id}`)}
                            >
                              <TableCell>
                                <div className="flex items-center gap-2.5">
                                  <Avatar className="h-7 w-7">
                                    <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                                      {initials || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-foreground">
                                    {emp.firstName} {emp.lastName}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {emp.position?.name ?? '—'}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {emp.user?.email ?? '—'}
                              </TableCell>
                              {canMutate ? (
                                <TableCell
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-12"
                                >
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onSelect={(e) => {
                                          e.preventDefault();
                                          setEmployeeToMove(emp);
                                          setMoveDepartmentId('');
                                          setMovePositionId('');
                                          setMoveError(null);
                                        }}
                                      >
                                        Move to department
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              ) : null}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>

              <section>
                <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
                  <Briefcase className="h-4 w-4" />
                  Positions
                </h2>
                {positions.length === 0 ? (
                  <div className="rounded-lg border border-dashed bg-muted/30 py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      No positions in this department
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {positions.map((pos) => (
                      <div
                        key={pos.id}
                        className="rounded-lg border bg-card px-4 py-2 text-sm font-medium text-foreground"
                      >
                        {pos.name}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        ) : null}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit department</SheetTitle>
          </SheetHeader>
          {department && (
            <DepartmentForm
              mode="edit"
              department={department}
              employees={allEmployees}
              onSubmit={handleUpdateSubmit}
              onCancel={() => setSheetOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>

      <Sheet
        open={employeeSheetOpen}
        onOpenChange={setEmployeeSheetOpen}
      >
        <SheetContent className="flex min-h-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          <SheetHeader className="shrink-0 border-b px-6 pb-4 pt-6 pr-14 text-left">
            <SheetTitle>Add employee</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4">
            {department && id && (
              <EmployeeForm
                mode="create"
                departments={[department]}
                positions={allPositions}
                employees={allEmployees}
                fixedDepartmentId={id}
                createPosition={createPosition}
                onSubmit={handleCreateEmployeeSubmit}
                onCancel={() => setEmployeeSheetOpen(false)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={!!employeeToMove}
        onOpenChange={(open) => {
          if (!open) {
            setEmployeeToMove(null);
            setMoveDepartmentId('');
            setMovePositionId('');
            setMoveError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {moveError ? (
              <p className="text-sm text-destructive" role="alert">
                {moveError}
              </p>
            ) : null}
            {otherDepartments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No other departments available. Create a department first.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Select
                    value={moveDepartmentId}
                    onValueChange={(v) => {
                      setMoveDepartmentId(v ?? '');
                      setMovePositionId('');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {otherDepartments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Position</label>
                  <Select
                    value={movePositionId}
                    onValueChange={(v) => setMovePositionId(v ?? '')}
                    disabled={!moveDepartmentId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {movePositions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEmployeeToMove(null);
                setMoveDepartmentId('');
                setMovePositionId('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMoveSubmit}
              disabled={
                otherDepartments.length === 0 ||
                !moveDepartmentId ||
                !movePositionId
              }
            >
              Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteDialog(false);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {department?.name}? This action
              cannot be undone.
              {deleteError ? (
                <span className="mt-2 block text-destructive">{deleteError}</span>
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
