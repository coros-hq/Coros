import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Rocket,
  X,
} from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { cn } from '~/lib/utils';

export interface OnboardingChecklistProps {
  organization: { isOnboarded: boolean; name: string };
  employeeCount: number;
  departmentCount: number;
  positionCount: number;
  projectCount: number;
  onDismiss: () => void;
}

const steps = [
  {
    id: 'organization',
    label: 'Create your organization',
    done: true,
    href: null as string | null,
  },
  {
    id: 'department',
    label: 'Add your first department',
    done: false,
    href: '/departments',
  },
  {
    id: 'position',
    label: 'Add your first position',
    done: false,
    href: '/departments',
  },
  {
    id: 'employee',
    label: 'Add your first employee',
    done: false,
    href: '/employees',
  },
  {
    id: 'project',
    label: 'Create your first project',
    done: false,
    href: '/projects',
  },
];

export function OnboardingChecklist({
  organization: _organization,
  employeeCount,
  departmentCount,
  positionCount,
  projectCount,
  onDismiss,
}: OnboardingChecklistProps) {
  const stepsWithDone = steps.map((s) => {
    if (s.id === 'organization') return { ...s, done: true };
    if (s.id === 'department') return { ...s, done: departmentCount > 0 };
    if (s.id === 'position') return { ...s, done: positionCount > 0 };
    if (s.id === 'employee') return { ...s, done: employeeCount > 0 };
    if (s.id === 'project') return { ...s, done: projectCount > 0 };
    return s;
  });

  const completedCount = stepsWithDone.filter((s) => s.done).length;
  const allComplete = completedCount === stepsWithDone.length;

  useEffect(() => {
    if (allComplete) {
      const t = setTimeout(onDismiss, 3000);
      return () => clearTimeout(t);
    }
  }, [allComplete, onDismiss]);

  if (allComplete) {
    return (
      <Card className="mb-6">
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-base font-medium text-foreground">
            🎉 You&apos;re all set! Your workspace is ready.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Get started with Coros</CardTitle>
              <CardDescription>
                Complete these steps to set up your workspace
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 -mt-1"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {completedCount} of {stepsWithDone.length} completed
            </span>
            <span>{Math.round((completedCount / stepsWithDone.length) * 100)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all duration-500"
              style={{
                width: `${(completedCount / stepsWithDone.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          {stepsWithDone.map((step) => (
            <div
              key={step.id}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    'text-sm',
                    step.done
                      ? 'text-muted-foreground line-through'
                      : 'text-foreground'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {!step.done && step.href && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-primary"
                  asChild
                >
                  <Link to={step.href}>
                    Go <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
