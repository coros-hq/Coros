import { Tree, TreeNode } from 'react-organizational-chart';
import { OrgChartCard } from './OrgChartCard';
import type { OrgChartNode } from '~/lib/org-chart';

function RecursiveNode({ node }: { node: OrgChartNode }) {
  return (
    <TreeNode label={<OrgChartCard node={node} />}>
      {node.children.map((child) => (
        <RecursiveNode key={child.id} node={child} />
      ))}
    </TreeNode>
  );
}

interface OrgChartTreeProps {
  roots: OrgChartNode[];
  organizationName: string;
}

export function OrgChartTree({ roots, organizationName }: OrgChartTreeProps) {
  // Single root — render directly
  if (roots.length === 1) {
    return (
      <Tree
        lineWidth="2px"
        lineColor="hsl(var(--border))"
        lineBorderRadius="8px"
        label={<OrgChartCard node={roots[0]} />}
      >
        {roots[0].children.map((child) => (
          <RecursiveNode key={child.id} node={child} />
        ))}
      </Tree>
    );
  }

  // Multiple roots — wrap in virtual org root node
  return (
    <Tree
      lineWidth="2px"
      lineColor="hsl(var(--border))"
      lineBorderRadius="8px"
      label={
        <div className="inline-flex items-center gap-2 rounded-xl border bg-primary px-4 py-2 shadow-sm">
          <span className="text-sm font-semibold text-primary-foreground">
            {organizationName}
          </span>
        </div>
      }
    >
      {roots.map((root) => (
        <RecursiveNode key={root.id} node={root} />
      ))}
    </Tree>
  );
}
