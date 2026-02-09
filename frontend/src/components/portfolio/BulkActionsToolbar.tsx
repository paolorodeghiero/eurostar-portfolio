import { X, FileDown, Trash2, ArrowRightCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PortfolioProject } from './columns/portfolioColumns';

interface BulkActionsToolbarProps {
  selectedCount: number;
  selectedProjects: PortfolioProject[];
  onClearSelection: () => void;
  onExport?: () => void;
  onStatusChange?: () => void;
  onDelete?: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  selectedProjects: _selectedProjects,
  onClearSelection,
  onExport,
  onStatusChange,
  onDelete,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 bg-primary text-primary-foreground rounded-lg shadow-lg px-4 py-2.5">
        {/* Selection count */}
        <span className="text-sm font-medium">
          {selectedCount} selected
        </span>

        {/* Divider */}
        <div className="w-px h-5 bg-primary-foreground/30" />

        {/* Actions - export deferred per CONTEXT.md but UI placeholder */}
        {onExport && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onExport}
            className="h-7"
          >
            <FileDown className="h-4 w-4 mr-1" />
            Export
          </Button>
        )}

        {onStatusChange && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onStatusChange}
            className="h-7"
          >
            <ArrowRightCircle className="h-4 w-4 mr-1" />
            Change Status
          </Button>
        )}

        {onDelete && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onDelete}
            className="h-7 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        )}

        {/* Clear selection */}
        <button
          onClick={onClearSelection}
          className="ml-2 p-1 hover:bg-primary-foreground/20 rounded"
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
