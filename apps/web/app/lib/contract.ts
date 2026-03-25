import type { ApiContract } from '~/services/contract.service';

export function getContractStatus(
  contract: ApiContract
): 'active' | 'expired' | 'pending' {
  const now = new Date();
  const start = new Date(contract.startDate);
  const end = contract.endDate ? new Date(contract.endDate) : null;

  if (start > now) return 'pending';
  if (end && end < now) return 'expired';
  return 'active';
}

export function getContractStatusConfig(status: string) {
  return (
    {
      active: {
        label: 'Active',
        className: 'bg-green-100 text-green-800 border-green-200',
      },
      expired: {
        label: 'Expired',
        className: 'bg-red-100 text-red-800 border-red-200',
      },
      pending: {
        label: 'Pending',
        className: 'bg-amber-100 text-amber-800 border-amber-200',
      },
    } as const
  )[status as 'active' | 'expired' | 'pending'] ?? {
    label: status,
    className: 'bg-muted text-muted-foreground',
  };
}

export function formatSalary(salary?: number | null, currency?: string): string {
  if (!salary) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency ?? 'USD',
    maximumFractionDigits: 0,
  }).format(salary);
}
