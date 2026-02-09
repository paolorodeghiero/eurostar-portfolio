import { useState, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Search, Plus, X } from 'lucide-react';
import { Table, ColumnFiltersState } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ColumnPicker } from './ColumnPicker';
import { DensityToggle, type Density } from './DensityToggle';
import { FilterChips } from './FilterChips';

interface PortfolioToolbarProps<TData> {
  table: Table<TData>;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  columnFilters: ColumnFiltersState;
  density: Density;
  onDensityChange: (density: Density) => void;
  onNewProject: () => void;
  statusOptions?: { id: number; name: string }[];
  teamOptions?: { id: number; name: string }[];
}

export function PortfolioToolbar<TData>({
  table,
  globalFilter,
  onGlobalFilterChange,
  columnFilters,
  density,
  onDensityChange,
  onNewProject,
  statusOptions = [],
  teamOptions = [],
}: PortfolioToolbarProps<TData>) {
  // Local state for input (immediate updates)
  const [searchInput, setSearchInput] = useState(globalFilter);

  // Debounced filter update (300ms per CONTEXT.md)
  const debouncedSetFilter = useDebouncedCallback(
    (value: string) => {
      onGlobalFilterChange(value);
    },
    300
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchInput(value);
      debouncedSetFilter(value);
    },
    [debouncedSetFilter]
  );

  const clearSearch = useCallback(() => {
    setSearchInput('');
    onGlobalFilterChange('');
    debouncedSetFilter.cancel();
  }, [onGlobalFilterChange, debouncedSetFilter]);

  return (
    <div className="space-y-2">
      {/* Main toolbar row */}
      <div className="flex items-center gap-3">
        {/* Global search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchInput}
            onChange={handleSearchChange}
            className="pl-9 pr-8"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Density toggle */}
        <DensityToggle density={density} onDensityChange={onDensityChange} />

        {/* Column picker */}
        <ColumnPicker columns={table.getAllLeafColumns()} />

        {/* New Project button */}
        <Button onClick={onNewProject}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Filter chips row (only shown when filters active) */}
      <FilterChips
        table={table}
        filters={columnFilters}
        statusOptions={statusOptions}
        teamOptions={teamOptions}
      />
    </div>
  );
}
