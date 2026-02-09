interface BudgetHealthCellProps {
  spent: number;
  budget: number;
}

export function BudgetHealthCell({ spent, budget }: BudgetHealthCellProps) {
  if (budget <= 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const percentage = (spent / budget) * 100;
  // Per STATE.md: green < 90%, orange 90-100%, red > 100%
  const color = percentage < 90 ? 'bg-green-500' : percentage <= 100 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-10 text-right">
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
}
