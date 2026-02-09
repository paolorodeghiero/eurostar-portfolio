import { memo } from 'react';
import { cn } from '@/lib/utils';

interface BudgetHealthCellProps {
  spent: number;
  budget: number;
  currency?: string;
}

function formatAmount(amount: number, currency: string = 'EUR'): string {
  if (amount >= 1_000_000) {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  }
  if (amount >= 1000) {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const BudgetHealthCell = memo(function BudgetHealthCell({
  spent,
  budget,
  currency = 'EUR',
}: BudgetHealthCellProps) {
  if (budget === 0 || budget === null || budget === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }

  const percentage = Math.round((spent / budget) * 100);
  const cappedPercentage = Math.min(percentage, 100);

  // Color based on percentage per existing decision (quick-004)
  const getBarColor = (pct: number) => {
    if (pct > 100) return 'bg-red-500';
    if (pct >= 90) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-1 min-w-[100px]">
      {/* Progress bar */}
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", getBarColor(percentage))}
          style={{ width: `${cappedPercentage}%` }}
        />
      </div>
      {/* Spent / Total text */}
      <div className="flex justify-between text-xs">
        <span className={cn(
          percentage > 100 ? 'text-red-600 font-medium' : 'text-muted-foreground'
        )}>
          {formatAmount(spent, currency)}
        </span>
        <span className="text-muted-foreground">
          / {formatAmount(budget, currency)}
        </span>
      </div>
    </div>
  );
});
