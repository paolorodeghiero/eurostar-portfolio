import { useMemo, useRef, useCallback, useState, type CSSProperties } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
  ColumnPinningState,
  ExpandedState,
  getExpandedRowModel,
  flexRender,
  type Column,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useTableState } from '@/hooks/useTableState';
import {
  portfolioColumns,
  defaultColumnVisibility,
  defaultColumnOrder,
  type PortfolioProject,
} from './columns/portfolioColumns';
import { EffortExpandedRow } from './columns/EffortExpandedRow';
import { ImpactExpandedRow } from './columns/ImpactExpandedRow';
import { cn } from '@/lib/utils';

type Density = 'comfortable' | 'compact';
const ROW_HEIGHT: Record<Density, number> = {
  comfortable: 53,
  compact: 37,
};

interface PortfolioTableProps {
  data: PortfolioProject[];
  loading?: boolean;
  onRowClick?: (project: PortfolioProject) => void;
  selectedProjectId?: number | null;
}

export function PortfolioTable({
  data,
  loading = false,
  onRowClick,
  selectedProjectId,
}: PortfolioTableProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Persisted state
  const [sorting, setSorting] = useTableState<SortingState>(
    'portfolio-sorting',
    [{ id: 'projectId', desc: true }] // Default: newest first
  );
  const [columnVisibility, setColumnVisibility] = useTableState<VisibilityState>(
    'portfolio-visibility',
    defaultColumnVisibility
  );
  const [columnOrder, setColumnOrder] = useTableState<string[]>(
    'portfolio-order',
    defaultColumnOrder
  );
  const [density] = useTableState<Density>(
    'portfolio-density',
    'comfortable'
  );

  // Non-persisted state (filters reset on page refresh per typical UX)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Column pinning state (pin first 3 columns: select, projectId, name)
  const [columnPinning] = useState<ColumnPinningState>({
    left: ['select', 'projectId', 'name'],
    right: [],
  });

  // Expanded rows state for effort/impact breakdowns
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // Memoize columns and data per TanStack Table FAQ
  const columns = useMemo(() => portfolioColumns, []);
  const memoizedData = useMemo(() => data, [data]);

  // Create table instance
  const table = useReactTable({
    data: memoizedData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      columnOrder,
      rowSelection,
      columnPinning,
      expanded,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    enableMultiSort: true,
    enableSortingRemoval: false, // Always have a sort direction
    getRowId: (row) => String(row.id),
  });

  // Helper function for pinned column styles
  const getCommonPinningStyles = (column: Column<PortfolioProject>): CSSProperties => {
    const isPinned = column.getIsPinned();
    const isLastLeftPinnedColumn = isPinned === 'left' && column.getIsLastColumn('left');

    return {
      left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
      position: isPinned ? 'sticky' : 'relative',
      width: column.getSize(),
      zIndex: isPinned ? 1 : 0,
      backgroundColor: isPinned ? 'hsl(var(--background))' : undefined,
      boxShadow: isLastLeftPinnedColumn ? '-4px 0 4px -4px gray inset' : undefined,
    };
  };

  // Virtual scrolling
  const { rows } = table.getRowModel();
  const rowHeight = ROW_HEIGHT[density];

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => rowHeight,
    overscan: 10, // Buffer rows for smooth scrolling
  });

  // Handle row click
  const handleRowClick = useCallback(
    (project: PortfolioProject) => {
      onRowClick?.(project);
    },
    [onRowClick]
  );

  // TODO: Expose methods for parent (filter, search, etc.)
  // These will be used by toolbar components in future plans
  // const tableApi = {
  //   setGlobalFilter,
  //   setColumnFilters,
  //   getColumnFilters: () => columnFilters,
  //   getVisibleColumns: () => table.getVisibleLeafColumns(),
  //   getAllColumns: () => table.getAllLeafColumns(),
  //   setColumnVisibility,
  //   setColumnOrder,
  //   setSorting,
  //   setDensity,
  //   density,
  //   selectedCount: Object.keys(rowSelection).length,
  //   getSelectedRows: () => table.getSelectedRowModel().rows.map((r) => r.original),
  //   clearSelection: () => setRowSelection({}),
  // };

  // Loading skeleton
  if (loading && data.length === 0) {
    return <TableLoadingSkeleton columnCount={columns.length} density={density} />;
  }

  // Empty state
  if (!loading && data.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-background">
        <p className="text-muted-foreground mb-2">No projects yet</p>
        <p className="text-sm text-muted-foreground">
          Create your first project to get started.
        </p>
      </div>
    );
  }

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  // Padding for virtual scroll
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start ?? 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0)
      : 0;

  return (
    <div className="space-y-2">
      {/* Row count */}
      <div className="text-sm text-muted-foreground">
        Showing {rows.length} of {data.length} projects
      </div>

      {/* Table container with virtual scroll */}
      <div
        ref={tableContainerRef}
        className="border rounded-lg overflow-auto bg-background"
        style={{ height: 'calc(100vh - 250px)', minHeight: '400px' }}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortIndex = sorting.findIndex((s) => s.id === header.id);
                  const isSorted = header.column.getIsSorted();

                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        ...getCommonPinningStyles(header.column),
                      }}
                      className={cn(
                        'select-none',
                        header.column.getCanSort() && 'cursor-pointer hover:bg-muted/50'
                      )}
                      onClick={(e) => {
                        if (header.column.getCanSort()) {
                          // Shift+click for multi-column sort
                          header.column.toggleSorting(undefined, e.shiftKey);
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {/* Sort indicator */}
                        {isSorted && (
                          <span className="text-xs text-muted-foreground">
                            {isSorted === 'asc' ? '↑' : '↓'}
                            {sorting.length > 1 && sortIndex >= 0 && (
                              <sup className="text-[10px] ml-0.5">{sortIndex + 1}</sup>
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {/* Top padding row */}
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} />
              </tr>
            )}
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];
              const isSelected = row.original.id === selectedProjectId;

              return (
                <>
                  <TableRow
                    key={row.id}
                    data-index={virtualRow.index}
                    className={cn(
                      'cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-primary/10 hover:bg-primary/15'
                        : 'hover:bg-muted/50',
                      density === 'compact' ? 'h-[37px]' : 'h-[53px]'
                    )}
                    onClick={() => handleRowClick(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{
                          ...getCommonPinningStyles(cell.column),
                        }}
                        className={cn(
                          density === 'compact' ? 'py-1 text-sm' : 'py-2'
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow key={`${row.id}-expanded`} className="hover:bg-transparent">
                      <TableCell colSpan={row.getVisibleCells().length} className="p-0">
                        {row.original._expandType === 'effort' ? (
                          <EffortExpandedRow teams={row.original.teams || []} />
                        ) : row.original._expandType === 'impact' ? (
                          <ImpactExpandedRow impactTeams={row.original.changeImpactTeams || []} />
                        ) : null}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
            {/* Bottom padding row */}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Export table API type for parent components
export type PortfolioTableApi = ReturnType<typeof useReactTable<PortfolioProject>> & {
  setGlobalFilter: (value: string) => void;
  setDensity: (density: Density) => void;
  density: Density;
  selectedCount: number;
  getSelectedRows: () => PortfolioProject[];
  clearSelection: () => void;
};

// Loading skeleton component
function TableLoadingSkeleton({
  columnCount,
  density,
}: {
  columnCount: number;
  density: Density;
}) {
  const rowHeight = density === 'compact' ? 'h-[37px]' : 'h-[53px]';
  const rowCount = density === 'compact' ? 20 : 12;

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: Math.min(columnCount, 10) }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rowCount }).map((_, i) => (
            <TableRow key={i} className={rowHeight}>
              {Array.from({ length: Math.min(columnCount, 10) }).map((_, j) => (
                <TableCell key={j}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
