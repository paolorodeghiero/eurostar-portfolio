import { Column } from '@tanstack/react-table';
import { Columns3, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

// Human-readable labels for column IDs
const COLUMN_LABELS: Record<string, string> = {
  select: 'Select',
  projectId: 'Project ID',
  name: 'Name',
  status: 'Status',
  leadTeam: 'Lead Team',
  pm: 'PM',
  valueScore: 'Value Score',
  effort: 'Effort',
  budgetHealth: 'Budget Health',
  committee: 'Committee',
  stopped: 'State',
};

interface ColumnPickerProps<TData> {
  columns: Column<TData, unknown>[];
}

export function ColumnPicker<TData>({ columns }: ColumnPickerProps<TData>) {
  // Filter to only hideable columns (exclude 'select' which should always be visible)
  const hideableColumns = columns.filter(
    (column) => column.getCanHide() && column.id !== 'select'
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Columns3 className="h-4 w-4" />
          <span className="hidden sm:inline">Columns</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandGroup heading="Toggle columns">
              {hideableColumns.map((column) => {
                const isVisible = column.getIsVisible();
                const label = COLUMN_LABELS[column.id] || column.id;

                return (
                  <CommandItem
                    key={column.id}
                    onSelect={() => column.toggleVisibility(!isVisible)}
                    className="cursor-pointer"
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded border',
                        isVisible
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {isVisible && <Check className="h-3 w-3" />}
                    </div>
                    <span>{label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
