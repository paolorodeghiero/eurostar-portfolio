import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  fetchProjectActualsSummary,
  fetchProjectReceipts,
  fetchProjectInvoices,
  deleteReceipt,
  deleteInvoice,
  type ProjectActualsSummary,
  type Receipt,
  type Invoice,
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
  const [showDetails, setShowDetails] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Get currency for display - use reportCurrency if set, otherwise budgetCurrency
  const displayCurrency = project.reportCurrency || project.budgetCurrency;

  useEffect(() => {
    if (!project.budgetCurrency) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchProjectActualsSummary(project.id)
      .then(setSummary)
      .catch((err) => {
        console.error('Failed to fetch actuals summary:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [project.id, project.budgetCurrency, project.reportCurrency]);

  const handleToggleDetails = async () => {
    const newShowDetails = !showDetails;
    setShowDetails(newShowDetails);

    // Fetch details if showing and not already loaded
    if (newShowDetails && receipts.length === 0 && invoices.length === 0) {
      setDetailsLoading(true);
      try {
        const [fetchedReceipts, fetchedInvoices] = await Promise.all([
          fetchProjectReceipts(project.projectId, displayCurrency),
          fetchProjectInvoices(project.projectId, displayCurrency),
        ]);
        setReceipts(fetchedReceipts);
        setInvoices(fetchedInvoices);
      } catch (err) {
        console.error('Failed to fetch actuals details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load details');
      } finally {
        setDetailsLoading(false);
      }
    }
  };

  const handleDelete = async (type: 'receipt' | 'invoice', id: number) => {
    try {
      if (type === 'receipt') {
        await deleteReceipt(id);
        setReceipts(prev => prev.filter(r => r.id !== id));
      } else {
        await deleteInvoice(id);
        setInvoices(prev => prev.filter(i => i.id !== id));
      }
      // Refresh summary to update totals
      const updatedSummary = await fetchProjectActualsSummary(project.id);
      setSummary(updatedSummary);
    } catch (err) {
      console.error(`Failed to delete ${type}:`, err);
      setError(err instanceof Error ? err.message : `Failed to delete ${type}`);
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

  const percentUsed = parseFloat(summary.percentUsed);
  const remaining = parseFloat(summary.budgetRemaining);
  const isOverBudget = remaining < 0;

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Actuals Summary</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleDetails}
          >
            {showDetails ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show Details
              </>
            )}
          </Button>
        </div>

        <div className="grid gap-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Receipts Total</span>
            <span className="font-medium">{formatWithCurrency(summary.totalReceipts)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Invoices Total</span>
            <span className="font-medium">{formatWithCurrency(summary.totalInvoices)}</span>
          </div>
          <div className="flex justify-between items-center border-t pt-3">
            <span className="font-semibold">Total Actuals</span>
            <span className="font-semibold">{formatWithCurrency(summary.totalActuals)}</span>
          </div>
        </div>
      </div>

      {/* Budget Comparison */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="font-medium">Budget Comparison</h3>
        <div className="grid gap-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Budget</span>
            <span className="font-medium">{formatWithCurrency(summary.budgetTotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={isOverBudget ? 'text-destructive' : 'text-green-600'}>
              Remaining
            </span>
            <span className={`font-medium ${isOverBudget ? 'text-destructive' : 'text-green-600'}`}>
              {formatWithCurrency(summary.budgetRemaining)}
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
            <AlertDescription className="text-sm">
              {summary.invoicesNeedingAttention} invoice{summary.invoicesNeedingAttention > 1 ? 's' : ''} need competence month review
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Details Table */}
      {showDetails && (
        <div className="border-t pt-4">
          {detailsLoading ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              Loading details...
            </div>
          ) : (
            <ActualsTable
              receipts={receipts}
              invoices={invoices}
              projectId={project.projectId}
              reportCurrency={project.reportCurrency}
              onDelete={handleDelete}
              disabled={disabled}
            />
          )}
        </div>
      )}
    </div>
  );
}
