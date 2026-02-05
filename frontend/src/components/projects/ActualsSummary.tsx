import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
import { ActualsTable } from './ActualsTable';
import { type Project } from '@/lib/project-api';

interface ActualsSummaryProps {
  project: Project;
}

export function ActualsSummary({ project }: ActualsSummaryProps) {
  const [summary, setSummary] = useState<ProjectActualsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchProjectActualsSummary(project.id)
      .then(setSummary)
      .catch((err) => {
        console.error('Failed to fetch actuals summary:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [project.id]);

  const handleToggleDetails = async () => {
    const newShowDetails = !showDetails;
    setShowDetails(newShowDetails);

    // Fetch details if showing and not already loaded
    if (newShowDetails && receipts.length === 0 && invoices.length === 0) {
      setDetailsLoading(true);
      try {
        const [fetchedReceipts, fetchedInvoices] = await Promise.all([
          fetchProjectReceipts(project.projectId),
          fetchProjectInvoices(project.projectId),
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
    <div className="border-t">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Actuals</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {summary.currency}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleDetails}
              className="h-7 text-xs"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show details
                </>
              )}
            </Button>
          </div>
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

      {showDetails && (
        detailsLoading ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            Loading details...
          </div>
        ) : (
          <ActualsTable
            receipts={receipts}
            invoices={invoices}
            projectId={project.projectId}
            reportCurrency={project.reportCurrency}
            onDelete={handleDelete}
            disabled={project.isStopped}
          />
        )
      )}
    </div>
  );
}
