import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { Pencil, Trash2 } from 'lucide-react';

const CURRENCIES = [
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'USD', label: 'USD' },
];

const SIZES = [
  { value: 'XS', label: 'XS - Extra Small' },
  { value: 'S', label: 'S - Small' },
  { value: 'M', label: 'M - Medium' },
  { value: 'L', label: 'L - Large' },
  { value: 'XL', label: 'XL - Extra Large' },
  { value: 'XXL', label: 'XXL - Extra Extra Large' },
];

interface CostTshirtThreshold {
  id: number;
  size: string;
  maxAmount: number;
  currency: string;
  usageCount: number;
  createdAt: string;
}

export function CostTshirtThresholdsPage() {
  const [thresholds, setThresholds] = useState<CostTshirtThreshold[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<CostTshirtThreshold | null>(null);
  const [formSize, setFormSize] = useState('');
  const [formMaxAmount, setFormMaxAmount] = useState<number | ''>(0);
  const [formCurrency, setFormCurrency] = useState('EUR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThresholds = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<CostTshirtThreshold[]>('/api/admin/cost-tshirt-thresholds');
      setThresholds(data);
    } catch (err) {
      console.error('Failed to fetch thresholds:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThresholds();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSize || formMaxAmount === '' || !formCurrency) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        size: formSize,
        maxAmount: formMaxAmount,
        currency: formCurrency,
      };

      if (editingThreshold) {
        await apiClient(`/api/admin/cost-tshirt-thresholds/${editingThreshold.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient('/api/admin/cost-tshirt-thresholds', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setIsDialogOpen(false);
      setEditingThreshold(null);
      resetForm();
      fetchThresholds();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormSize('');
    setFormMaxAmount(0);
    setFormCurrency('EUR');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this threshold?')) return;

    try {
      await apiClient(`/api/admin/cost-tshirt-thresholds/${id}`, { method: 'DELETE' });
      fetchThresholds();
    } catch (err) {
      console.error('Failed to delete threshold:', err);
    }
  };

  const openCreateDialog = () => {
    setEditingThreshold(null);
    resetForm();
    setError(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (threshold: CostTshirtThreshold) => {
    setEditingThreshold(threshold);
    setFormSize(threshold.size);
    setFormMaxAmount(threshold.maxAmount);
    setFormCurrency(threshold.currency);
    setError(null);
    setIsDialogOpen(true);
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSizeOrder = (size: string) => {
    const order: Record<string, number> = { XS: 0, S: 1, M: 2, L: 3, XL: 4, XXL: 5 };
    return order[size] ?? 99;
  };

  const columns: ColumnDef<CostTshirtThreshold>[] = [
    {
      accessorKey: 'size',
      header: 'Size',
      cell: ({ row }) => (
        <Badge className="font-mono text-sm">{row.original.size}</Badge>
      ),
      sortingFn: (rowA, rowB) =>
        getSizeOrder(rowA.original.size) - getSizeOrder(rowB.original.size),
    },
    {
      accessorKey: 'maxAmount',
      header: 'Max Amount',
      cell: ({ row }) => (
        <span className="font-mono font-medium">
          {formatAmount(row.original.maxAmount, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: 'currency',
      header: 'Currency',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.currency}</Badge>
      ),
    },
    {
      accessorKey: 'usageCount',
      header: 'Usage',
      cell: ({ row }) => (
        <Badge variant={row.original.usageCount > 0 ? 'secondary' : 'outline'}>
          {row.original.usageCount} project(s)
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditDialog(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
            disabled={row.original.usageCount > 0}
            title={
              row.original.usageCount > 0
                ? `Cannot delete: in use by ${row.original.usageCount} project(s)`
                : 'Delete threshold'
            }
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cost T-shirt Thresholds</h1>
        <p className="text-muted-foreground mt-1">
          Manage T-shirt size to budget amount mappings for quick project sizing.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={thresholds}
        onAdd={openCreateDialog}
        addButtonLabel="Add Threshold"
        filterPlaceholder="Search thresholds..."
        emptyMessage="No thresholds found. Create your first threshold."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingThreshold ? 'Edit Threshold' : 'Add Threshold'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="size">
                Size <span className="text-red-500">*</span>
              </Label>
              <select
                id="size"
                value={formSize}
                onChange={(e) => setFormSize(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select size...</option>
                {SIZES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAmount">
                Max Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                id="maxAmount"
                value={formMaxAmount}
                onChange={(e) =>
                  setFormMaxAmount(e.target.value === '' ? '' : Number(e.target.value))
                }
                required
                min={0}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Maximum budget amount for this T-shirt size
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">
                Currency <span className="text-red-500">*</span>
              </Label>
              <select
                id="currency"
                value={formCurrency}
                onChange={(e) => setFormCurrency(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formSize || formMaxAmount === '' || !formCurrency}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
