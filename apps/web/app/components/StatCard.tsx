interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

export function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-[11px] font-semibold uppercase leading-tight tracking-wide text-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold leading-none tracking-tight text-foreground">{value}</p>
      {sub ? <p className="mt-1.5 text-xs font-normal leading-tight text-muted-foreground">{sub}</p> : null}
    </div>
  );
}
