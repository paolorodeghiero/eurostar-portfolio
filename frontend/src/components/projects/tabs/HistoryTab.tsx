import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  fetchProjectHistory,
  formatOperation,
  formatValue,
  formatTimestamp,
  type HistoryEntry,
  type HistoryResponse,
} from '@/lib/project-history-api';
import { User, Clock, ArrowRight, RefreshCw, ChevronDown } from 'lucide-react';

interface HistoryTabProps {
  projectId: number;
}

export function HistoryTab({ projectId }: HistoryTabProps) {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    loadHistory();
  }, [projectId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchProjectHistory(projectId, { limit: 20 });
      setData(result);
    } catch (err) {
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!data || loadingMore) return;

    try {
      setLoadingMore(true);
      const result = await fetchProjectHistory(projectId, {
        limit: 20,
        offset: data.history.length,
      });
      setData({
        ...result,
        history: [...data.history, ...result.history],
      });
    } catch (err) {
      setError('Failed to load more history');
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        Loading history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-2">
        <p className="text-destructive text-sm">{error}</p>
        <Button size="sm" variant="outline" onClick={loadHistory}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const history = data?.history || [];

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
        <Clock className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Change History ({data?.pagination.total || 0} entries)
        </h3>
        <Button size="sm" variant="ghost" onClick={loadHistory}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />

        {/* Entries */}
        <div className="space-y-4">
          {history.map((entry) => (
            <HistoryEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      </div>

      {/* Load more button */}
      {data?.pagination.hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            size="sm"
            variant="outline"
            disabled={loadingMore}
            onClick={loadMore}
          >
            {loadingMore ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Load More
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// Individual history entry card
function HistoryEntryCard({ entry }: { entry: HistoryEntry }) {
  const operationColors: Record<string, string> = {
    INSERT: 'bg-green-100 text-green-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
  };

  return (
    <div className="relative pl-10">
      {/* Timeline dot */}
      <div className="absolute left-2.5 top-2 h-3 w-3 rounded-full bg-muted-foreground/50 border-2 border-background" />

      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={operationColors[entry.operation] || ''}>
            {formatOperation(entry.operation)}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3" />
            {entry.user}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimestamp(entry.timestamp)}
          </span>
        </div>

        {/* Changes */}
        {entry.changes.length > 0 && (
          <div className="space-y-1">
            {entry.changes.map((change, idx) => (
              <div key={idx} className="text-sm flex items-start gap-2">
                <span className="font-medium text-muted-foreground shrink-0">
                  {change.fieldLabel}:
                </span>
                {entry.operation === 'INSERT' ? (
                  <span className="text-green-700">
                    {formatValue(change.newValue)}
                  </span>
                ) : entry.operation === 'DELETE' ? (
                  <span className="text-red-700 line-through">
                    {formatValue(change.oldValue)}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <span className="text-muted-foreground line-through">
                      {formatValue(change.oldValue)}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-foreground">
                      {formatValue(change.newValue)}
                    </span>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
