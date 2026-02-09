import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  type AvailableBudgetLine
} from '@/lib/project-budget-api';
import type { Project } from '@/lib/project-api';

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
  onProjectUpdated?: () => void;
  disabled?: boolean;
}

export function BudgetTab({ project, onProjectUpdated, disabled }: BudgetTabProps) {
  const [budget, setBudget] = useState<ProjectBudget | null>(null);
  const [loading, setLoading] = useState(true);
  const [localOpex, setLocalOpex] = useState('');
  const [localCapex, setLocalCapex] = useState('');
  const [editMode, setEditMode] = useState(false);

  // Use project.reportCurrency from header toggle as the single currency
  const currency = project.reportCurrency;

  // Add allocation state
  const [addOpen, setAddOpen] = useState(false);
  const [availableLines, setAvailableLines] = useState<AvailableBudgetLine[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);
  const [allocationAmount, setAllocationAmount] = useState('');
  const [allocationError, setAllocationError] = useState<string | null>(null);

  // Edit allocation state
  const [editingAllocation, setEditingAllocation] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const loadBudget = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProjectBudget(project.id);
      setBudget(data);
      // Use converted values if available (when reportCurrency differs from budgetCurrency)
      setLocalOpex(data.convertedOpex || data.opexBudget || '');
      setLocalCapex(data.convertedCapex || data.capexBudget || '');
    } catch (err) {
      console.error('Failed to load budget:', err);
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  // Load budget on mount and when reportCurrency changes (set via header toggle)
  useEffect(() => {
    loadBudget();
  }, [loadBudget, project.reportCurrency]);

  // Load available budget lines when currency changes and add dialog opens
  useEffect(() => {
    if (addOpen && currency) {
      fetchAvailableBudgetLines(currency).then(setAvailableLines);
    }
  }, [addOpen, currency]);

  // Auto-save budget totals
  const { statusText } = useAutoSave({
    data: {
      opexBudget: localOpex,
      capexBudget: localCapex,
    },
    onSave: async (data) => {
      const updated = await updateProjectBudget(project.id, {
        opexBudget: data.opexBudget || null,
        capexBudget: data.capexBudget || null,
        budgetCurrency: currency || null,
      });
      // Preserve existing allocations since PUT response doesn't include them
      setBudget(prev => ({
        ...updated,
        allocations: prev?.allocations || [],
        totalAllocated: prev?.totalAllocated || '0.00',
        allocationMatch: prev?.allocationMatch ?? true,
      }));
    },
    delay: 2500,
    enabled: !disabled && !!currency,
  });

  const handleAddAllocation = async () => {
    if (!selectedLineId || !allocationAmount) return;

    setAllocationError(null);
    try {
      await addBudgetAllocation(project.id, selectedLineId, allocationAmount);
      await loadBudget();
      setAddOpen(false);
      setSelectedLineId(null);
      setAllocationAmount('');
      onProjectUpdated?.();
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
      onProjectUpdated?.();
    } catch (err) {
      console.error('Failed to update allocation:', err);
    }
  };

  const handleRemoveAllocation = async (budgetLineId: number) => {
    try {
      await removeBudgetAllocation(project.id, budgetLineId);
      await loadBudget();
      onProjectUpdated?.();
    } catch (err) {
      console.error('Failed to remove allocation:', err);
    }
  };

  const formatCurrency = (value: string | null, curr: string | null) => {
    if (!value || !curr) return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return value;

    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const displayCurrency = currency;

  const selectedLine = availableLines.find(l => l.id === selectedLineId);
  const canAddAllocation = selectedLineId && allocationAmount &&
    parseFloat(allocationAmount) > 0 &&
    (!selectedLine || parseFloat(allocationAmount) <= parseFloat(selectedLine.available));

  if (loading) {
    return <div className="text-muted-foreground">Loading budget...</div>;
  }

  return (
    <div className="space-y-6">
      {/* OPEX/CAPEX Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* OPEX Card */}
        <div className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">OPEX</span>
            <Badge variant="outline" className="text-xs">Operating</Badge>
          </div>
          {editMode ? (
            <Input
              type="text"
              value={localOpex}
              onChange={(e) => setLocalOpex(e.target.value)}
              placeholder="0.00"
              disabled={disabled || !currency}
              className="text-lg font-semibold"
            />
          ) : (
            <div className="text-2xl font-semibold">
              {formatCurrency(budget?.convertedOpex || budget?.opexBudget || '0', displayCurrency)}
            </div>
          )}
        </div>

        {/* CAPEX Card */}
        <div className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">CAPEX</span>
            <Badge variant="outline" className="text-xs">Capital</Badge>
          </div>
          {editMode ? (
            <Input
              type="text"
              value={localCapex}
              onChange={(e) => setLocalCapex(e.target.value)}
              placeholder="0.00"
              disabled={disabled || !currency}
              className="text-lg font-semibold"
            />
          ) : (
            <div className="text-2xl font-semibold">
              {formatCurrency(budget?.convertedCapex || budget?.capexBudget || '0', displayCurrency)}
            </div>
          )}
        </div>
      </div>

      {/* Edit/Save Button and Total */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Total:</span>
          <span className="text-lg font-semibold">
            {formatCurrency(budget?.totalBudget || '0', displayCurrency)}
          </span>
          {budget?.costTshirt && (
            <Badge className={TSHIRT_COLORS[budget.costTshirt] || 'bg-gray-300'}>
              {budget.costTshirt}
            </Badge>
          )}
        </div>
        <Button
          variant={editMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => setEditMode(!editMode)}
          disabled={disabled || !currency}
        >
          {editMode ? 'Done' : 'Edit Budget'}
        </Button>
      </div>

      {statusText && editMode && (
        <span className="text-xs text-muted-foreground block">{statusText}</span>
      )}

      {!currency && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Set currency in header to edit budget
          </AlertDescription>
        </Alert>
      )}

      {/* Allocation Match Alert */}
      {budget && !budget.allocationMatch && parseFloat(budget.totalAllocated) > 0 && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Allocated amount ({formatCurrency(budget.totalAllocated, displayCurrency)}) does not match
            declared budget ({formatCurrency(budget.totalBudget, displayCurrency)})
          </AlertDescription>
        </Alert>
      )}

      {/* Budget Allocations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Allocations</h3>
          <Popover open={addOpen} onOpenChange={setAddOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={disabled || !currency}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
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
                        <div>
                          <button
                            onClick={() => {
                              setEditingAllocation(allocation.budgetLineId);
                              setEditAmount(allocation.allocationAmount);
                            }}
                            disabled={disabled}
                            className="hover:underline"
                          >
                            {allocation.convertedAmount
                              ? formatCurrency(allocation.convertedAmount, displayCurrency)
                              : formatCurrency(allocation.allocationAmount, allocation.currency)}
                          </button>
                          {allocation.convertedAmount && (
                            <div className="text-xs text-muted-foreground mt-1">
                              from {formatCurrency(allocation.allocationAmount, allocation.currency)}
                            </div>
                          )}
                        </div>
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
                    {formatCurrency(budget.totalAllocated, displayCurrency)}
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
