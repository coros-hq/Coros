import { createPortal } from 'react-dom';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { GitBranch, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import type { ApiEmployee } from '~/services/employee.service';
import { listEmployees } from '~/services/employee.service';
import { getOrganizationMe } from '~/services/organization.service';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { buildOrgTree } from '~/lib/org-chart';

// react-organizational-chart uses Emotion and accesses `document` — must load only on client
const OrgChartTree = lazy(() =>
  import('~/components/org-chart/OrgChartTree').then((m) => ({ default: m.OrgChartTree }))
);

export default function OrgChartPage() {
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [orgName, setOrgName] = useState('Organization');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [portalReady, setPortalReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const headerPortal = useRef<Element | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    headerPortal.current = document.getElementById('page-header');
    setPortalReady(true);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [emps, org] = await Promise.all([
          listEmployees(),
          getOrganizationMe(),
        ]);
        setEmployees(emps);
        setOrgName(org.name);
      } catch {
        setError('Failed to load org chart');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const roots = buildOrgTree(employees);

  function handleZoomIn() {
    setZoom((z) => Math.min(z + 0.1, 2));
  }

  function handleZoomOut() {
    setZoom((z) => Math.max(z - 0.1, 0.3));
  }

  function handleResetZoom() {
    setZoom(1);
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex justify-center mt-12">
          <Skeleton className="h-44 w-44 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <GitBranch className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground">No employees yet</p>
        <p className="text-sm text-muted-foreground">
          Add employees to see the org chart
        </p>
      </div>
    );
  }

  return (
    <>
      {portalReady && headerPortal.current
        ? createPortal(
            <div className="flex w-full items-center justify-between">
              <h1 className="text-lg font-bold text-foreground">Org Chart</h1>
              <div className="flex items-center gap-1 rounded-md border border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleZoomOut}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground px-2 tabular-nums">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleZoomIn}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleResetZoom}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>,
            headerPortal.current
          )
        : null}

      <div
        className="overflow-auto p-8"
        style={{ minHeight: 'calc(100vh - 120px)' }}
      >
        <div
          ref={containerRef}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease',
          }}
        >
          {mounted ? (
            <Suspense
              fallback={
                <div className="flex justify-center py-12">
                  <Skeleton className="h-44 w-44 rounded-xl" />
                </div>
              }
            >
              <OrgChartTree roots={roots} organizationName={orgName} />
            </Suspense>
          ) : (
            <div className="flex justify-center py-12">
              <Skeleton className="h-44 w-44 rounded-xl" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
