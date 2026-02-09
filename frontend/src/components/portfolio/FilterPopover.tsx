import { useState } from 'react';
import { Column } from '@tanstack/react-table';
import { Filter, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  CommandInput,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

// Filter type per column
type FilterType = 'text' | 'select' | 'number';

const FILTER_TYPES: Record<string, FilterType> = {
  projectId: 'text',
  name: 'text',
  status: 'select',
  leadTeam: 'select',
  pm: 'text',
  valueScore: 'number',
  budgetHealth: 'number',
};

interface FilterOption {
  id: number;
  name: string;
  color?: string;
}

interface FilterPopoverProps<TData> {
  column: Column<TData, unknown>;
  options?: FilterOption[]; // For select-type filters
  label: string;
}

export function FilterPopover<TData>({
  column,
  options = [],
  label,
}: FilterPopoverProps<TData>) {
  const [open, setOpen] = useState(false);
  const filterType = FILTER_TYPES[column.id] || 'text';
  const currentValue = column.getFilterValue();
  const hasFilter = currentValue !== undefined && currentValue !== '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-6 w-6 p-0',
            hasFilter && 'text-primary'
          )}
          aria-label={`Filter ${label}`}
        >
          <Filter className={cn('h-3 w-3', hasFilter && 'fill-current')} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[200px] p-0">
        {filterType === 'select' ? (
          <SelectFilter
            column={column}
            options={options}
            onClose={() => setOpen(false)}
          />
        ) : filterType === 'number' ? (
          <NumberFilter
            column={column}
            onClose={() => setOpen(false)}
          />
        ) : (
          <TextFilter
            column={column}
            onClose={() => setOpen(false)}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

// Text input filter
function TextFilter<TData>({
  column,
  onClose,
}: {
  column: Column<TData, unknown>;
  onClose: () => void;
}) {
  const [value, setValue] = useState(String(column.getFilterValue() ?? ''));

  const handleApply = () => {
    column.setFilterValue(value || undefined);
    onClose();
  };

  const handleClear = () => {
    column.setFilterValue(undefined);
    setValue('');
    onClose();
  };

  return (
    <div className="p-3 space-y-3">
      <Input
        placeholder="Filter..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleApply();
          if (e.key === 'Escape') onClose();
        }}
        autoFocus
      />
      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={handleClear}>
          Clear
        </Button>
        <Button size="sm" onClick={handleApply}>
          Apply
        </Button>
      </div>
    </div>
  );
}

// Select dropdown filter
function SelectFilter<TData>({
  column,
  options,
  onClose,
}: {
  column: Column<TData, unknown>;
  options: FilterOption[];
  onClose: () => void;
}) {
  const currentValue = column.getFilterValue() as number | undefined;

  const handleSelect = (id: number | undefined) => {
    column.setFilterValue(id);
    onClose();
  };

  return (
    <Command>
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandGroup>
          {/* All option to clear filter */}
          <CommandItem
            onSelect={() => handleSelect(undefined)}
            className="cursor-pointer"
          >
            <div className={cn(
              'mr-2 flex h-4 w-4 items-center justify-center',
              currentValue === undefined && 'text-primary'
            )}>
              {currentValue === undefined && <Check className="h-3 w-3" />}
            </div>
            <span className="text-muted-foreground">All</span>
          </CommandItem>
          {options.map((option) => (
            <CommandItem
              key={option.id}
              onSelect={() => handleSelect(option.id)}
              className="cursor-pointer"
            >
              <div className={cn(
                'mr-2 flex h-4 w-4 items-center justify-center',
                currentValue === option.id && 'text-primary'
              )}>
                {currentValue === option.id && <Check className="h-3 w-3" />}
              </div>
              {option.color && (
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: option.color }}
                />
              )}
              <span>{option.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

// Number range filter (simplified - just min/max input)
function NumberFilter<TData>({
  column,
  onClose,
}: {
  column: Column<TData, unknown>;
  onClose: () => void;
}) {
  const currentValue = column.getFilterValue() as [number?, number?] | undefined;
  const [min, setMin] = useState(String(currentValue?.[0] ?? ''));
  const [max, setMax] = useState(String(currentValue?.[1] ?? ''));

  const handleApply = () => {
    const minNum = min ? Number(min) : undefined;
    const maxNum = max ? Number(max) : undefined;
    if (minNum === undefined && maxNum === undefined) {
      column.setFilterValue(undefined);
    } else {
      column.setFilterValue([minNum, maxNum]);
    }
    onClose();
  };

  const handleClear = () => {
    column.setFilterValue(undefined);
    setMin('');
    setMax('');
    onClose();
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Min"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className="w-full"
        />
        <span className="text-muted-foreground">-</span>
        <Input
          type="number"
          placeholder="Max"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="w-full"
        />
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={handleClear}>
          Clear
        </Button>
        <Button size="sm" onClick={handleApply}>
          Apply
        </Button>
      </div>
    </div>
  );
}
