import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart2,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  ShieldOff,
  Users,
} from 'lucide-react';

import { BarChartCard } from '~/components/reports/BarChartCard';
import { LineChartCard } from '~/components/reports/LineChartCard';
import { MetricCard } from '~/components/reports/MetricCard';
import { PieChartCard } from '~/components/reports/PieChartCard';
import { Skeleton } from '~/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import {
  countActiveProjects,
  countLeaveRequestsThisMonth,
  countTasksCompletedThisWeek,
  EMPLOYMENT_TYPE_PIE_COLORS,
  getApprovalRate,
  getDepartmentDistribution,
  getEmploymentTypeBreakdown,
  getHeadcountByMonth,
  getLeaveByMonth,
  getLeaveStatusBreakdown,
  getLeaveTypeBreakdownColored,
  getOverdueTasks,
  getProjectStatusBreakdown,
  getTaskCompletionRate,
  getTaskStatusBreakdown,
  PROJECT_STATUS_PIE_COLORS,
} from '~/lib/reports';
import { getAll as getAllEmployees } from '~/services/employee.service';
import { getAllLeaveRequests } from '~/services/leave-request.service';
import { getAllProjects } from '~/services/project.service';
import { getAll as getProjectTasks, type ApiTask } from '~/services/task.service';
import { useAuthStore } from '~/stores/auth.store';

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'Failed to load reports.';
}

export default function ReportsPage() {
  const user = useAuthStore((s) => s.user);
  const canAccess =
    user?.role === 'admin' || user?.role === 'super_admin';

  const [employees, setEmployees] = useState<Awaited<
    ReturnType<typeof getAllEmployees>
  > | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<Awaited<
    ReturnType<typeof getAllLeaveRequests>
  > | null>(null);
  const [projects, setProjects] = useState<Awaited<
    ReturnType<typeof getAllProjects>
  > | null>(null);
  const [tasks, setTasks] = useState<ApiTask[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canAccess) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [emps, leaves, projs] = await Promise.all([
          getAllEmployees(),
          getAllLeaveRequests(),
          getAllProjects(),
        ]);
        if (cancelled) return;
        const taskLists = await Promise.all(
          projs.map((p) => getProjectTasks(p.id)),
        );
        if (cancelled) return;
        const flat = taskLists.flat();
        setEmployees(emps);
        setLeaveRequests(leaves);
        setProjects(projs);
        setTasks(flat);
      } catch (e) {
        if (!cancelled) {
          setError(extractErrorMessage(e));
          setEmployees(null);
          setLeaveRequests(null);
          setProjects(null);
          setTasks(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canAccess]);

  const headcountData = useMemo(
    () => (employees ? getHeadcountByMonth(employees) : []),
    [employees],
  );
  const employmentPie = useMemo(() => {
    if (!employees) return { data: [] as { name: string; value: number }[], colors: [] as string[] };
    const rows = getEmploymentTypeBreakdown(employees).filter((d) => d.value > 0);
    const colors = rows.map(
      (_, i) => EMPLOYMENT_TYPE_PIE_COLORS[i % EMPLOYMENT_TYPE_PIE_COLORS.length],
    );
    return { data: rows, colors };
  }, [employees]);

  const departmentBars = useMemo(
    () => (employees ? getDepartmentDistribution(employees) : []),
    [employees],
  );

  const leaveByMonth = useMemo(
    () => (leaveRequests ? getLeaveByMonth(leaveRequests) : []),
    [leaveRequests],
  );

  const leaveTypeColored = useMemo(
    () => (leaveRequests ? getLeaveTypeBreakdownColored(leaveRequests) : []),
    [leaveRequests],
  );

  const leaveStatus = useMemo(
    () => (leaveRequests ? getLeaveStatusBreakdown(leaveRequests) : null),
    [leaveRequests],
  );

  const approvalRate = useMemo(
    () => (leaveRequests ? getApprovalRate(leaveRequests) : 0),
    [leaveRequests],
  );

  const projectPieData = useMemo(
    () => (projects ? getProjectStatusBreakdown(projects) : []),
    [projects],
  );

  const taskStatusBars = useMemo(
    () => (tasks ? getTaskStatusBreakdown(tasks) : []),
    [tasks],
  );

  const taskCompletionRate = useMemo(
    () => (tasks ? getTaskCompletionRate(tasks) : 0),
    [tasks],
  );

  const overdue = useMemo(
    () => (tasks ? getOverdueTasks(tasks) : []),
    [tasks],
  );

  const overview = useMemo(() => {
    if (!employees || !leaveRequests || !projects || !tasks) {
      return {
        totalEmployees: 0,
        leaveThisMonth: 0,
        tasksDoneThisWeek: 0,
        activeProjects: 0,
      };
    }
    return {
      totalEmployees: employees.length,
      leaveThisMonth: countLeaveRequestsThisMonth(leaveRequests),
      tasksDoneThisWeek: countTasksCompletedThisWeek(tasks),
      activeProjects: countActiveProjects(projects),
    };
  }, [employees, leaveRequests, projects, tasks]);

  if (!canAccess) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <ShieldOff className="h-12 w-12 text-muted-foreground" aria-hidden />
        <p className="max-w-md text-sm text-muted-foreground">
          You don&apos;t have access to this page
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full space-y-8 px-4 py-8">
      <div>
        <div className="flex items-center gap-2">
          <BarChart2 className="h-7 w-7 text-primary" aria-hidden />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Reports &amp; analytics
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Organization insights across people, leave, and projects.
        </p>
      </div>

      {error ? (
        <div
          className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total employees"
            value={overview.totalEmployees}
            subtitle="Active directory"
            icon={Users}
          />
          <MetricCard
            title="Leave requests (this month)"
            value={overview.leaveThisMonth}
            subtitle="By start date"
            icon={CalendarDays}
          />
          <MetricCard
            title="Tasks completed (this week)"
            value={overview.tasksDoneThisWeek}
            subtitle="Marked done"
            icon={CheckCircle2}
          />
          <MetricCard
            title="Active projects"
            value={overview.activeProjects}
            subtitle="Status: active"
            icon={FolderKanban}
          />
        </div>
      )}

      <Tabs defaultValue="people" className="space-y-6">
        <TabsList>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="people" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <LineChartCard
              title="Headcount over time"
              data={headcountData}
              xKey="month"
              yKey="count"
              isLoading={isLoading}
            />
            <PieChartCard
              title="Employment types"
              data={employmentPie.data}
              colors={employmentPie.colors}
              donut
              isLoading={isLoading}
            />
          </div>
          <BarChartCard
            title="Employees by department"
            data={departmentBars}
            xKey="name"
            yKey="count"
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="leave" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <BarChartCard
              title="Leave requests by month"
              data={leaveByMonth}
              xKey="month"
              yKey="count"
              isLoading={isLoading}
            />
            <PieChartCard
              title="Leave by type"
              data={leaveTypeColored.map(({ name, value }) => ({
                name,
                value,
              }))}
              colors={leaveTypeColored.map((x) => x.color)}
              isLoading={isLoading}
            />
          </div>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[100px] w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Approved requests"
                value={leaveStatus?.approved ?? 0}
                subtitle="All time"
                icon={CheckCircle2}
                valueClassName="text-emerald-600 dark:text-emerald-400"
              />
              <MetricCard
                title="Rejected requests"
                value={leaveStatus?.rejected ?? 0}
                subtitle="All time"
                icon={AlertTriangle}
                valueClassName="text-red-600 dark:text-red-400"
              />
              <MetricCard
                title="Pending requests"
                value={leaveStatus?.pending ?? 0}
                subtitle="Awaiting decision"
                icon={CalendarDays}
                valueClassName="text-amber-600 dark:text-amber-400"
              />
              <MetricCard
                title="Approval rate"
                value={`${approvalRate}%`}
                subtitle="Approved vs rejected"
                icon={CheckCircle2}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <PieChartCard
              title="Projects by status"
              data={projectPieData}
              colors={[...PROJECT_STATUS_PIE_COLORS]}
              donut
              isLoading={isLoading}
            />
            <BarChartCard
              title="Tasks by status"
              data={taskStatusBars.map(({ name, value }) => ({
                name,
                value,
              }))}
              xKey="name"
              yKey="value"
              isLoading={isLoading}
            />
          </div>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[100px] w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard
                title="Total tasks"
                value={tasks?.length ?? 0}
                subtitle="Across all projects"
                icon={BarChart2}
              />
              <MetricCard
                title="Completed tasks"
                value={tasks?.filter((t) => t.status === 'done').length ?? 0}
                subtitle={`${taskCompletionRate}% completion rate`}
                icon={CheckCircle2}
              />
              <MetricCard
                title="Overdue tasks"
                value={overdue.length}
                subtitle="Past due & not done"
                icon={AlertTriangle}
                valueClassName={
                  overdue.length > 0
                    ? 'text-red-600 dark:text-red-400'
                    : undefined
                }
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
