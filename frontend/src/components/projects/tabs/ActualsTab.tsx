import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertCircle } from 'lucide-react';
import {
  fetchProjectActualsSummary,
  fetchProjectReceipts,
  deleteReceipt,
  type ProjectActualsSummary,
  type Receipt,
} from '@/lib/actuals-api';
import { ActualsTable } from '../ActualsTable';
import { type Project } from '@/lib/project-api';

interface ActualsTabProps {
  project: Project;
  disabled?: boolean;
}

export function ActualsTab({ project, disabled }: ActualsTabProps) {
  const [summary, setSummary] = useState<ProjectActualsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  // Get currency for display - use reportCurrency if set, otherwise budgetCurrency
  const displayCurrency = project.reportCurrency || project.budgetCurrency;

  useEffect(() => {
    if (!project.budgetCurrency) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    // Fetch both summary and receipts on mount
    Promise.all([
      fetchProjectActualsSummary(project.id, displayCurrency),
      fetchProjectReceipts(project.projectId, displayCurrency),
    ])
      .then(([summaryData, receiptsData]) => {
        setSummary(summaryData);
        setReceipts(receiptsData);
      })
      .catch((err) => {
        console.error('Failed to fetch actuals:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [project.id, project.projectId, project.budgetCurrency, project.reportCurrency, displayCurrency]);

  const handleDelete = async (id: number) => {
    try {
      await deleteReceipt(id);
      setReceipts(prev => prev.filter(r => r.id !== id));
      // Refresh summary to update totals
      const updatedSummary = await fetchProjectActualsSummary(project.id, displayCurrency);
      setSummary(updatedSummary);
    } catch (err) {
      console.error('Failed to delete receipt:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete receipt');
    }
  };

  const handleDeleteAll = async () => {
    try {
      // Delete all receipts using Promise.all
      await Promise.all(receipts.map(r => deleteReceipt(r.id)));
      setReceipts([]);
      // Refresh summary
      const updatedSummary = await fetchProjectActualsSummary(project.id, displayCurrency);
      setSummary(updatedSummary);
      setDeleteAllOpen(false);
    } catch (err) {
      console.error('Failed to delete all receipts:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete all receipts');
      setDeleteAllOpen(false);
    }
  };

  // Format value with currency inline
  const formatWithCurrency = (value: string | number) => {
    if (!displayCurrency) return String(value);
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return String(value);
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  if (!project.budgetCurrency) {
    return (
      <div className="text-sm text-muted-foreground">
        Set a budget currency to track actuals.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading actuals...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        Failed to load actuals: {error}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const totalReceipts = parseFloat(summary.totalReceipts);
  const budget = parseFloat(summary.budgetTotal);
  const remaining = parseFloat(summary.budgetRemaining);
  const percentUsed = parseFloat(summary.percentUsed);
  const isOverBudget = remaining < 0;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Total Receipts</div>
          <div className="text-2xl font-semibold">{formatWithCurrency(totalReceipts)}</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Budget</div>
          <div className="text-2xl font-semibold">{formatWithCurrency(budget)}</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Remaining</div>
          <div className={`text-2xl font-semibold ${isOverBudget ? 'text-destructive' : 'text-green-600'}`}>
            {formatWithCurrency(remaining)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Budget Used</span>
          <span>{percentUsed.toFixed(1)}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              percentUsed > 100 ? 'bg-destructive' : percentUsed > 90 ? 'bg-orange-500' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(percentUsed, 100)}%` }}
          />
        </div>
      </div>

      {summary.invoicesNeedingAttention > 0 && (
        <Alert variant="default" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {summary.invoicesNeedingAttention} invoice{summary.invoicesNeedingAttention > 1 ? 's' : ''} need competence month review
          </AlertDescription>
        </Alert>
      )}

      {/* Receipts Table */}
      <div className="border-t pt-4">
        <ActualsTable
          receipts={receipts}
          projectId={project.projectId}
          onDelete={handleDelete}
          onDeleteAll={() => setDeleteAllOpen(true)}
          disabled={disabled}
        />
      </div>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all receipts?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {receipts.length} receipt{receipts.length !== 1 ? 's' : ''} for this project. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
