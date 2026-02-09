import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
  flexRender,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import { PortfolioToolbar } from '@/components/portfolio/PortfolioToolbar';
import { BulkActionsToolbar } from '@/components/portfolio/BulkActionsToolbar';
import { FilterPopover } from '@/components/portfolio/FilterPopover';
import { DraggableHeader, DraggableHeaderContext } from '@/components/portfolio/DraggableHeader';
import {
  portfolioColumns,
  defaultColumnVisibility,
  defaultColumnOrder,
  type PortfolioProject,
} from '@/components/portfolio/columns/portfolioColumns';
import { useTableState } from '@/hooks/useTableState';
import { type Density } from '@/components/portfolio/DensityToggle';

import { ProjectSidebar } from '@/components/projects/ProjectSidebar';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { ActualsUploadDialog } from '@/components/ActualsUploadDialog';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { fetchPortfolioProjects } from '@/lib/project-api';

const ROW_HEIGHT: Record<Density, number> = {
  comfortable: 53,
  compact: 37,
};

export function PortfolioPage() {
  // Data state
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Reference data for filters (would come from API)
  const [statuses, setStatuses] = useState<{ id: number; name: string; color: string }[]>([]);
  const [teams, setTeams] = useState<{ id: number; name: string }[]>([]);

  // Table ref for virtual scrolling
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Persisted table state
  const [sorting, setSorting] = useTableState<SortingState>(
    'portfolio-sorting',
    [{ id: 'projectId', desc: true }]
  );
  const [columnVisibility, setColumnVisibility] = useTableState<VisibilityState>(
    'portfolio-visibility',
    defaultColumnVisibility
  );
  const [columnOrder, setColumnOrder] = useTableState<string[]>(
    'portfolio-order',
    defaultColumnOrder
  );
  const [density, setDensity] = useTableState<Density>(
    'portfolio-density',
    'comfortable'
  );

  // Non-persisted state
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Memoize for TanStack Table
  const columns = useMemo(() => portfolioColumns, []);
  const data = useMemo(() => projects, [projects]);

  // Create table
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      columnOrder,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableMultiSort: true,
    enableSortingRemoval: false,
    getRowId: (row) => String(row.id),
    // Custom global filter to search text fields
    globalFilterFn: (row, columnId, filterValue) => {
      const search = String(filterValue).toLowerCase();
      const project = row.original;
      const searchable = [
        project.projectId,
        project.name,
        project.projectManager,
        project.status?.name,
        project.leadTeam?.name,
      ].filter(Boolean);
      return searchable.some((field) =>
        String(field).toLowerCase().includes(search)
      );
    },
  });

  // Virtual scrolling
  const { rows } = table.getRowModel();
  const rowHeight = ROW_HEIGHT[density];
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  // Load data
  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPortfolioProjects();
      setProjects(data);
      // Extract unique statuses and teams for filter dropdowns
      const uniqueStatuses = new Map<number, { id: number; name: string; color: string }>();
      const uniqueTeams = new Map<number, { id: number; name: string }>();
      data.forEach((p) => {
        if (p.status) uniqueStatuses.set(p.status.id, p.status);
        if (p.leadTeam) uniqueTeams.set(p.leadTeam.id, p.leadTeam);
      });
      setStatuses(Array.from(uniqueStatuses.values()));
      setTeams(Array.from(uniqueTeams.values()));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Handlers
  const handleRowClick = useCallback((project: PortfolioProject) => {
    setSelectedProjectId(project.id);
    setSidebarOpen(true);
  }, []);

  const handleAlertClick = useCallback((projectId: number) => {
    setSelectedProjectId(projectId);
    setSidebarOpen(true);
  }, []);

  const handleProjectCreated = useCallback((project: { id: number }) => {
    loadProjects();
    setSelectedProjectId(project.id);
    setSidebarOpen(true);
  }, [loadProjects]);

  const selectedCount = Object.keys(rowSelection).length;
  const selectedProjects = table.getSelectedRowModel().rows.map((r) => r.original);

  // Rendering
  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start ?? 0 : 0;
  const paddingBottom = virtualRows.length > 0
    ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0)
    : 0;

  return (
    <div className="min-h-screen bg-eurostar-light">
      {/* Top bar */}
      <PortfolioHeader
        onUploadActuals={() => setUploadOpen(true)}
        onAlertClick={handleAlertClick}
      />

      {/* Main content */}
      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <PortfolioToolbar
          table={table}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          columnFilters={columnFilters}
          density={density}
          onDensityChange={setDensity}
          onNewProject={() => setCreateOpen(true)}
          statusOptions={statuses}
          teamOptions={teams}
        />

        {/* Row count */}
        <div className="text-sm text-muted-foreground">
          Showing {rows.length} of {data.length} projects
        </div>

        {/* Table */}
        {loading && data.length === 0 ? (
          <TableLoadingSkeleton density={density} />
        ) : data.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-background">
            <p className="text-muted-foreground mb-2">No projects yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first project to get started.
            </p>
          </div>
        ) : (
          <DraggableHeaderContext
            columnOrder={columnOrder}
            onColumnOrderChange={setColumnOrder}
          >
            <div
              ref={tableContainerRef}
              className="border rounded-lg overflow-auto bg-background"
              style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}
            >
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const sortIndex = sorting.findIndex((s) => s.id === header.id);
                        const isSorted = header.column.getIsSorted();
                        const canDrag = header.id !== 'select';
                        const canFilter = ['status', 'leadTeam', 'name', 'pm'].includes(header.id);

                        return (
                          <TableHead
                            key={header.id}
                            style={{ width: header.getSize() }}
                            className="select-none"
                          >
                            <DraggableHeader id={header.id} canDrag={canDrag}>
                              <div
                                className={cn(
                                  'flex items-center gap-1',
                                  header.column.getCanSort() && 'cursor-pointer hover:text-foreground'
                                )}
                                onClick={(e) => {
                                  if (header.column.getCanSort()) {
                                    header.column.toggleSorting(undefined, e.shiftKey);
                                  }
                                }}
                              >
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                                {isSorted && (
                                  <span className="text-xs text-muted-foreground">
                                    {isSorted === 'asc' ? '↑' : '↓'}
                                    {sorting.length > 1 && sortIndex >= 0 && (
                                      <sup className="text-[10px] ml-0.5">{sortIndex + 1}</sup>
                                    )}
                                  </span>
                                )}
                                {canFilter && (
                                  <FilterPopover
                                    column={header.column}
                                    label={header.id}
                                    options={
                                      header.id === 'status'
                                        ? statuses
                                        : header.id === 'leadTeam'
                                        ? teams
                                        : undefined
                                    }
                                  />
                                )}
                              </div>
                            </DraggableHeader>
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {paddingTop > 0 && (
                    <tr><td style={{ height: `${paddingTop}px` }} /></tr>
                  )}
                  {virtualRows.map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    const isSelected = row.original.id === selectedProjectId;

                    return (
                      <TableRow
                        key={row.id}
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
                            style={{ width: cell.column.getSize() }}
                            className={cn(
                              density === 'compact' ? 'py-1 text-sm' : 'py-2'
                            )}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                  {paddingBottom > 0 && (
                    <tr><td style={{ height: `${paddingBottom}px` }} /></tr>
                  )}
                </TableBody>
              </Table>
            </div>
          </DraggableHeaderContext>
        )}

        {/* Bulk actions toolbar */}
        <BulkActionsToolbar
          selectedCount={selectedCount}
          selectedProjects={selectedProjects}
          onClearSelection={() => setRowSelection({})}
          // Bulk actions deferred - UI ready
        />
      </div>

      {/* Sidebar */}
      <ProjectSidebar
        projectId={selectedProjectId}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        onProjectUpdated={loadProjects}
        onDeleted={() => {
          loadProjects();
          setSelectedProjectId(null);
        }}
      />

      {/* Create dialog */}
      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleProjectCreated}
      />

      {/* Upload dialog */}
      <ActualsUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploadComplete={() => {
          loadProjects();
          if (selectedProjectId && sidebarOpen) {
            setSidebarOpen(false);
            setTimeout(() => setSidebarOpen(true), 100);
          }
        }}
      />
    </div>
  );
}

// Loading skeleton
function TableLoadingSkeleton({ density }: { density: Density }) {
  const rowHeight = density === 'compact' ? 'h-[37px]' : 'h-[53px]';
  const rowCount = density === 'compact' ? 20 : 12;

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rowCount }).map((_, i) => (
            <TableRow key={i} className={rowHeight}>
              {Array.from({ length: 10 }).map((_, j) => (
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
