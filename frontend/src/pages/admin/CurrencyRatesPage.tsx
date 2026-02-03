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
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
];

interface CurrencyRate {
  id: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  validFrom: string;
  validTo: string | null;
  usageCount: number;
  createdAt: string;
}

export function CurrencyRatesPage() {
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<CurrencyRate | null>(null);
  const [formFromCurrency, setFormFromCurrency] = useState('');
  const [formToCurrency, setFormToCurrency] = useState('');
  const [formRate, setFormRate] = useState<number | ''>('');
  const [formValidFrom, setFormValidFrom] = useState('');
  const [formValidTo, setFormValidTo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<CurrencyRate[]>('/api/admin/currency-rates');
      setRates(data);
    } catch (err) {
      console.error('Failed to fetch currency rates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFromCurrency || !formToCurrency || formRate === '' || !formValidFrom) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        fromCurrency: formFromCurrency,
        toCurrency: formToCurrency,
        rate: formRate,
        validFrom: formValidFrom,
        validTo: formValidTo || null,
      };

      if (editingRate) {
        await apiClient(`/api/admin/currency-rates/${editingRate.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient('/api/admin/currency-rates', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setIsDialogOpen(false);
      setEditingRate(null);
      resetForm();
      fetchRates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormFromCurrency('');
    setFormToCurrency('');
    setFormRate('');
    setFormValidFrom(new Date().toISOString().split('T')[0]);
    setFormValidTo('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this currency rate?')) return;

    try {
      await apiClient(`/api/admin/currency-rates/${id}`, { method: 'DELETE' });
      fetchRates();
    } catch (err) {
      console.error('Failed to delete currency rate:', err);
    }
  };

  const openCreateDialog = () => {
    setEditingRate(null);
    resetForm();
    setError(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (rate: CurrencyRate) => {
    setEditingRate(rate);
    setFormFromCurrency(rate.fromCurrency);
    setFormToCurrency(rate.toCurrency);
    setFormRate(rate.rate);
    setFormValidFrom(rate.validFrom.split('T')[0]);
    setFormValidTo(rate.validTo?.split('T')[0] || '');
    setError(null);
    setIsDialogOpen(true);
  };

  const columns: ColumnDef<CurrencyRate>[] = [
    {
      accessorKey: 'pair',
      header: 'Currency Pair',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline">{row.original.fromCurrency}</Badge>
          <span className="text-muted-foreground">to</span>
          <Badge variant="outline">{row.original.toCurrency}</Badge>
        </div>
      ),
    },
    {
      accessorKey: 'rate',
      header: 'Rate',
      cell: ({ row }) => (
        <span className="font-mono font-medium">
          {row.original.rate.toFixed(4)}
        </span>
      ),
    },
    {
      accessorKey: 'validFrom',
      header: 'Valid From',
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.original.validFrom).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: 'validTo',
      header: 'Valid To',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.validTo
            ? new Date(row.original.validTo).toLocaleDateString()
            : 'Open'}
        </span>
      ),
    },
    {
      accessorKey: 'usageCount',
      header: 'Usage',
      cell: ({ row }) => (
        <Badge variant={row.original.usageCount > 0 ? 'secondary' : 'outline'}>
          {row.original.usageCount} conversion(s)
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
                ? `Cannot delete: in use by ${row.original.usageCount} conversion(s)`
                : 'Delete currency rate'
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
        <h1 className="text-2xl font-bold text-gray-900">Currency Rates</h1>
        <p className="text-muted-foreground mt-1">
          Manage exchange rates between currencies for budget conversions.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={rates}
        onAdd={openCreateDialog}
        addButtonLabel="Add Currency Rate"
        filterPlaceholder="Search rates..."
        emptyMessage="No currency rates found. Create your first rate."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRate ? 'Edit Currency Rate' : 'Add Currency Rate'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromCurrency">
                  From Currency <span className="text-red-500">*</span>
                </Label>
                <select
                  id="fromCurrency"
                  value={formFromCurrency}
                  onChange={(e) => setFormFromCurrency(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select...</option>
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="toCurrency">
                  To Currency <span className="text-red-500">*</span>
                </Label>
                <select
                  id="toCurrency"
                  value={formToCurrency}
                  onChange={(e) => setFormToCurrency(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select...</option>
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">
                Rate <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                id="rate"
                value={formRate}
                onChange={(e) =>
                  setFormRate(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="e.g., 1.1234"
                required
                step="0.0001"
                min="0"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                1 {formFromCurrency || 'FROM'} = {formRate || '?'} {formToCurrency || 'TO'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">
                  Valid From <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  id="validFrom"
                  value={formValidFrom}
                  onChange={(e) => setFormValidFrom(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validTo">Valid To</Label>
                <Input
                  type="date"
                  id="validTo"
                  value={formValidTo}
                  onChange={(e) => setFormValidTo(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for open-ended validity
                </p>
              </div>
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
                disabled={
                  isSubmitting ||
                  !formFromCurrency ||
                  !formToCurrency ||
                  formRate === '' ||
                  !formValidFrom
                }
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
