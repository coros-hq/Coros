import { useNavigate } from 'react-router';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import type { OrgChartNode } from '~/lib/org-chart';

export function OrgChartCard({ node }: { node: OrgChartNode }) {
  const navigate = useNavigate();

  return (
    <div
      className="inline-flex flex-col items-center gap-2 rounded-xl border bg-card p-4 shadow-sm cursor-pointer hover:border-primary hover:shadow-md transition-all w-44"
      onClick={() => navigate(`/employees/${node.id}`)}
    >
      <Avatar className="h-12 w-12">
        <AvatarFallback
          className="text-sm font-semibold text-white"
          style={{ backgroundColor: node.departmentColor ?? 'hsl(var(--primary))' }}
        >
          {node.firstName[0]}{node.lastName[0]}
        </AvatarFallback>
      </Avatar>
      <div className="text-center min-w-0 w-full">
        <p className="text-sm font-semibold text-foreground truncate">
          {node.firstName} {node.lastName}
        </p>
        {node.position && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {node.position}
          </p>
        )}
        {node.department && (
          <div className="flex items-center justify-center gap-1 mt-1">
            {node.departmentColor && (
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: node.departmentColor }}
              />
            )}
            <span className="text-xs text-muted-foreground truncate">
              {node.department}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
