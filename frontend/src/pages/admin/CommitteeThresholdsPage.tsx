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

const LEVELS = [
  { value: 'mandatory', label: 'Mandatory' },
  { value: 'optional', label: 'Optional' },
  { value: 'not_necessary', label: 'Not Necessary' },
];

interface CommitteeThreshold {
  id: number;
  minAmount: number;
  maxAmount: number | null;
  level: string;
  currency: string;
  usageCount: number;
  createdAt: string;
}

export function CommitteeThresholdsPage() {
  const [thresholds, setThresholds] = useState<CommitteeThreshold[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<CommitteeThreshold | null>(null);
  const [formMinAmount, setFormMinAmount] = useState<number | ''>(0);
  const [formMaxAmount, setFormMaxAmount] = useState<number | ''>('');
  const [formLevel, setFormLevel] = useState('');
  const [formCurrency, setFormCurrency] = useState('EUR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThresholds = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<CommitteeThreshold[]>('/api/admin/committee-thresholds');
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
    if (formMinAmount === '' || !formLevel || !formCurrency) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        minAmount: formMinAmount,
        maxAmount: formMaxAmount === '' ? null : formMaxAmount,
        level: formLevel,
        currency: formCurrency,
      };

      if (editingThreshold) {
        await apiClient(`/api/admin/committee-thresholds/${editingThreshold.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient('/api/admin/committee-thresholds', {
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
    setFormMinAmount(0);
    setFormMaxAmount('');
    setFormLevel('');
    setFormCurrency('EUR');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this threshold?')) return;

    try {
      await apiClient(`/api/admin/committee-thresholds/${id}`, { method: 'DELETE' });
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

  const openEditDialog = (threshold: CommitteeThreshold) => {
    setEditingThreshold(threshold);
    setFormMinAmount(threshold.minAmount);
    setFormMaxAmount(threshold.maxAmount ?? '');
    setFormLevel(threshold.level);
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

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'mandatory':
        return 'default';
      case 'optional':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const columns: ColumnDef<CommitteeThreshold>[] = [
    {
      accessorKey: 'range',
      header: 'Amount Range',
      cell: ({ row }) => (
        <span className="font-mono">
          {formatAmount(row.original.minAmount, row.original.currency)}
          {' - '}
          {row.original.maxAmount
            ? formatAmount(row.original.maxAmount, row.original.currency)
            : 'Unlimited'}
        </span>
      ),
    },
    {
      accessorKey: 'level',
      header: 'Committee Level',
      cell: ({ row }) => (
        <Badge variant={getLevelBadgeVariant(row.original.level)}>
          {LEVELS.find((l) => l.value === row.original.level)?.label || row.original.level}
        </Badge>
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
        <h1 className="text-2xl font-bold text-gray-900">Committee Thresholds</h1>
        <p className="text-muted-foreground mt-1">
          Manage budget thresholds that determine committee approval requirements.
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minAmount">
                  Min Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  id="minAmount"
                  value={formMinAmount}
                  onChange={(e) =>
                    setFormMinAmount(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  required
                  min={0}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAmount">Max Amount</Label>
                <Input
                  type="number"
                  id="maxAmount"
                  value={formMaxAmount}
                  onChange={(e) =>
                    setFormMaxAmount(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  min={0}
                  placeholder="Unlimited"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">
                Committee Level <span className="text-red-500">*</span>
              </Label>
              <select
                id="level"
                value={formLevel}
                onChange={(e) => setFormLevel(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select level...</option>
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
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
                disabled={isSubmitting || formMinAmount === '' || !formLevel || !formCurrency}
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
