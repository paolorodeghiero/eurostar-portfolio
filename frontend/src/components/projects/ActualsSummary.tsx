import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { fetchProjectActualsSummary, type ProjectActualsSummary } from '@/lib/actuals-api';

interface ActualsSummaryProps {
  projectId: number;
}

export function ActualsSummary({ projectId }: ActualsSummaryProps) {
  const [summary, setSummary] = useState<ProjectActualsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchProjectActualsSummary(projectId)
      .then(setSummary)
      .catch((err) => {
        console.error('Failed to fetch actuals summary:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Loading actuals...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        Failed to load actuals: {error}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const percentUsed = parseFloat(summary.percentUsed);
  const remaining = parseFloat(summary.budgetRemaining);
  const isOverBudget = remaining < 0;

  return (
    <div className="border-t p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Actuals</h3>
        <Badge variant="outline" className="text-xs">
          {summary.currency}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Receipts Total:</span>
          <span className="font-medium">{summary.totalReceipts}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Invoices Total:</span>
          <span className="font-medium">{summary.totalInvoices}</span>
        </div>
        <div className="flex justify-between border-t pt-2">
          <span className="font-semibold">Total Actuals:</span>
          <span className="font-semibold">{summary.totalActuals}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Budget:</span>
          <span className="font-medium">{summary.budgetTotal}</span>
        </div>
        <div className="flex justify-between">
          <span className={isOverBudget ? 'text-destructive' : 'text-green-600'}>
            Remaining:
          </span>
          <span className={`font-medium ${isOverBudget ? 'text-destructive' : 'text-green-600'}`}>
            {summary.budgetRemaining}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Budget Used</span>
          <span>{percentUsed.toFixed(1)}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              isOverBudget ? 'bg-destructive' : percentUsed > 90 ? 'bg-orange-500' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(percentUsed, 100)}%` }}
          />
        </div>
      </div>

      {summary.invoicesNeedingAttention > 0 && (
        <Alert variant="default" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {summary.invoicesNeedingAttention} invoice{summary.invoicesNeedingAttention > 1 ? 's' : ''} need competence month review
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
