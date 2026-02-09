import { X } from 'lucide-react';
import { Table, ColumnFiltersState } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Human-readable labels for filter values
const COLUMN_LABELS: Record<string, string> = {
  projectId: 'Project ID',
  name: 'Name',
  status: 'Status',
  leadTeam: 'Lead Team',
  pm: 'PM',
  valueScore: 'Value',
  effort: 'Effort',
  budgetHealth: 'Budget',
  committee: 'Committee',
  stopped: 'State',
};

interface FilterChipsProps<TData> {
  table: Table<TData>;
  filters: ColumnFiltersState;
  statusOptions?: { id: number; name: string }[];
  teamOptions?: { id: number; name: string }[];
}

export function FilterChips<TData>({
  table,
  filters,
  statusOptions = [],
  teamOptions = [],
}: FilterChipsProps<TData>) {
  if (filters.length === 0) {
    return null;
  }

  // Format filter value for display
  const formatFilterValue = (columnId: string, value: unknown): string => {
    if (columnId === 'status' && typeof value === 'number') {
      const status = statusOptions.find((s) => s.id === value);
      return status?.name || String(value);
    }
    if (columnId === 'leadTeam' && typeof value === 'number') {
      const team = teamOptions.find((t) => t.id === value);
      return team?.name || String(value);
    }
    if (typeof value === 'string') {
      // Truncate long values
      return value.length > 20 ? `${value.substring(0, 20)}...` : value;
    }
    return String(value);
  };

  const removeFilter = (columnId: string) => {
    const column = table.getColumn(columnId);
    if (column) {
      column.setFilterValue(undefined);
    }
  };

  const clearAllFilters = () => {
    table.resetColumnFilters();
  };

  return (
    <div className="flex items-center gap-2 flex-wrap py-2">
      <span className="text-sm text-muted-foreground">Filters:</span>
      {filters.map((filter) => {
        const label = COLUMN_LABELS[filter.id] || filter.id;
        const valueDisplay = formatFilterValue(filter.id, filter.value);

        return (
          <Badge
            key={filter.id}
            variant="secondary"
            className="gap-1 pr-1 font-normal"
          >
            <span className="font-medium">{label}:</span>
            <span>{valueDisplay}</span>
            <button
              onClick={() => removeFilter(filter.id)}
              className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 transition-colors"
              aria-label={`Remove ${label} filter`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}
      {filters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
