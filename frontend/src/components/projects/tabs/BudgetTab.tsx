import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useAutoSave } from '@/hooks/useAutoSave';
import {
  fetchProjectBudget,
  updateProjectBudget,
  fetchAvailableBudgetLines,
  addBudgetAllocation,
  updateBudgetAllocation,
  removeBudgetAllocation,
  type ProjectBudget,
  type AvailableBudgetLine,
} from '@/lib/project-budget-api';
import type { Project } from '@/lib/project-api';

const CURRENCIES = [
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
];

const TSHIRT_COLORS: Record<string, string> = {
  XS: 'bg-gray-300 text-gray-800',
  S: 'bg-blue-300 text-blue-800',
  M: 'bg-green-300 text-green-800',
  L: 'bg-yellow-300 text-yellow-800',
  XL: 'bg-orange-300 text-orange-800',
  XXL: 'bg-red-300 text-red-800',
};

interface BudgetTabProps {
  project: Project;
  disabled?: boolean;
}

export function BudgetTab({ project, disabled }: BudgetTabProps) {
  const [budget, setBudget] = useState<ProjectBudget | null>(null);
  const [loading, setLoading] = useState(true);
  const [localOpex, setLocalOpex] = useState('');
  const [localCapex, setLocalCapex] = useState('');
  const [localCurrency, setLocalCurrency] = useState('');

  // Add allocation state
  const [addOpen, setAddOpen] = useState(false);
  const [availableLines, setAvailableLines] = useState<AvailableBudgetLine[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);
  const [allocationAmount, setAllocationAmount] = useState('');
  const [allocationError, setAllocationError] = useState<string | null>(null);

  // Edit allocation state
  const [editingAllocation, setEditingAllocation] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const loadBudget = async () => {
    setLoading(true);
    try {
      const data = await fetchProjectBudget(project.id);
      setBudget(data);
      setLocalOpex(data.opexBudget || '');
      setLocalCapex(data.capexBudget || '');
      setLocalCurrency(data.budgetCurrency || '');
    } catch (err) {
      console.error('Failed to load budget:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudget();
  }, [project.id]);

  // Load available budget lines when currency changes and add dialog opens
  useEffect(() => {
    if (addOpen && localCurrency) {
      fetchAvailableBudgetLines(localCurrency).then(setAvailableLines);
    }
  }, [addOpen, localCurrency]);

  // Auto-save budget totals
  const { statusText } = useAutoSave({
    data: { opexBudget: localOpex, capexBudget: localCapex, budgetCurrency: localCurrency },
    onSave: async (data) => {
      const updated = await updateProjectBudget(project.id, {
        opexBudget: data.opexBudget || null,
        capexBudget: data.capexBudget || null,
        budgetCurrency: data.budgetCurrency || null,
      });
      setBudget(updated);
    },
    delay: 2500,
    enabled: !disabled && !!localCurrency,
  });

  const handleCurrencyChange = async (currency: string) => {
    setLocalCurrency(currency);
    try {
      const updated = await updateProjectBudget(project.id, {
        budgetCurrency: currency,
      });
      setBudget(updated);
    } catch (err) {
      console.error('Failed to update currency:', err);
    }
  };

  const handleAddAllocation = async () => {
    if (!selectedLineId || !allocationAmount) return;

    setAllocationError(null);
    try {
      await addBudgetAllocation(project.id, selectedLineId, allocationAmount);
      await loadBudget();
      setAddOpen(false);
      setSelectedLineId(null);
      setAllocationAmount('');
    } catch (err) {
      setAllocationError(err instanceof Error ? err.message : 'Failed to add allocation');
    }
  };

  const handleUpdateAllocation = async (budgetLineId: number) => {
    if (!editAmount) return;

    try {
      await updateBudgetAllocation(project.id, budgetLineId, editAmount);
      await loadBudget();
      setEditingAllocation(null);
      setEditAmount('');
    } catch (err) {
      console.error('Failed to update allocation:', err);
    }
  };

  const handleRemoveAllocation = async (budgetLineId: number) => {
    try {
      await removeBudgetAllocation(project.id, budgetLineId);
      await loadBudget();
    } catch (err) {
      console.error('Failed to remove allocation:', err);
    }
  };

  const formatCurrency = (value: string | null, currency: string | null) => {
    if (!value) return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ''}`;
  };

  const selectedLine = availableLines.find(l => l.id === selectedLineId);
  const canAddAllocation = selectedLineId && allocationAmount &&
    parseFloat(allocationAmount) > 0 &&
    (!selectedLine || parseFloat(allocationAmount) <= parseFloat(selectedLine.available));

  if (loading) {
    return <div className="text-muted-foreground">Loading budget...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Budget Totals Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Budget Totals</h3>
          {statusText && (
            <span className="text-xs text-muted-foreground">{statusText}</span>
          )}
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={localCurrency}
              onValueChange={handleCurrencyChange}
              disabled={disabled}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="opex">OPEX Budget</Label>
            <Input
              id="opex"
              type="text"
              value={localOpex}
              onChange={(e) => setLocalOpex(e.target.value)}
              placeholder="0.00"
              disabled={disabled || !localCurrency}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capex">CAPEX Budget</Label>
            <Input
              id="capex"
              type="text"
              value={localCapex}
              onChange={(e) => setLocalCapex(e.target.value)}
              placeholder="0.00"
              disabled={disabled || !localCurrency}
            />
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Budget</span>
              <span className="font-semibold">
                {formatCurrency(budget?.totalBudget || '0', localCurrency)}
              </span>
            </div>

            {budget?.costTshirt && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cost T-shirt Size</span>
                <Badge className={TSHIRT_COLORS[budget.costTshirt] || 'bg-gray-300'}>
                  {budget.costTshirt}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Allocation Match Alert */}
      {budget && !budget.allocationMatch && parseFloat(budget.totalAllocated) > 0 && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Allocated amount ({formatCurrency(budget.totalAllocated, localCurrency)}) does not match
            declared budget ({formatCurrency(budget.totalBudget, localCurrency)})
          </AlertDescription>
        </Alert>
      )}

      {/* Budget Allocations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Budget Allocations</h3>
          <Popover open={addOpen} onOpenChange={setAddOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={disabled || !localCurrency}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Allocation
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="end">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Budget Line</Label>
                  <Command>
                    <CommandInput placeholder="Search budget lines..." />
                    <CommandList>
                      <CommandEmpty>No budget lines available</CommandEmpty>
                      <CommandGroup>
                        {availableLines.map((line) => (
                          <CommandItem
                            key={line.id}
                            onSelect={() => setSelectedLineId(line.id)}
                            className={selectedLineId === line.id ? 'bg-accent' : ''}
                          >
                            <div className="flex flex-col">
                              <span>{line.lineValue} - {line.company}</span>
                              <span className="text-xs text-muted-foreground">
                                Available: {formatCurrency(line.available, line.currency)}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>

                {selectedLineId && (
                  <div className="space-y-2">
                    <Label htmlFor="allocation-amount">Amount</Label>
                    <Input
                      id="allocation-amount"
                      type="text"
                      value={allocationAmount}
                      onChange={(e) => setAllocationAmount(e.target.value)}
                      placeholder="0.00"
                    />
                    {selectedLine && parseFloat(allocationAmount) > parseFloat(selectedLine.available) && (
                      <p className="text-xs text-red-500">
                        Amount exceeds available budget ({formatCurrency(selectedLine.available, selectedLine.currency)})
                      </p>
                    )}
                  </div>
                )}

                {allocationError && (
                  <p className="text-sm text-red-500">{allocationError}</p>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleAddAllocation}
                    disabled={!canAddAllocation}
                    className="flex-1"
                  >
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAddOpen(false);
                      setSelectedLineId(null);
                      setAllocationAmount('');
                      setAllocationError(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Allocations Table */}
        {budget && budget.allocations.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Budget Line</th>
                  <th className="text-right p-3 text-sm font-medium">Allocated</th>
                  <th className="text-right p-3 text-sm font-medium">Available</th>
                  <th className="w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {budget.allocations.map((allocation) => (
                  <tr key={allocation.budgetLineId} className="border-t">
                    <td className="p-3 text-sm">
                      <div>
                        <div className="font-medium">{allocation.lineValue}</div>
                        <div className="text-xs text-muted-foreground">{allocation.company}</div>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-right">
                      {editingAllocation === allocation.budgetLineId ? (
                        <Input
                          type="text"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          onBlur={() => handleUpdateAllocation(allocation.budgetLineId)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateAllocation(allocation.budgetLineId);
                            if (e.key === 'Escape') {
                              setEditingAllocation(null);
                              setEditAmount('');
                            }
                          }}
                          className="h-8 text-right"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setEditingAllocation(allocation.budgetLineId);
                            setEditAmount(allocation.allocationAmount);
                          }}
                          disabled={disabled}
                          className="hover:underline"
                        >
                          {formatCurrency(allocation.allocationAmount, allocation.currency)}
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-sm text-right text-muted-foreground">
                      {formatCurrency(allocation.availableAmount, allocation.currency)}
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAllocation(allocation.budgetLineId)}
                        disabled={disabled}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t bg-muted/50">
                <tr>
                  <td className="p-3 text-sm font-medium">Total Allocated</td>
                  <td className="p-3 text-sm text-right font-semibold">
                    {formatCurrency(budget.totalAllocated, localCurrency)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No allocations yet.</p>
        )}
      </div>
    </div>
  );
}
