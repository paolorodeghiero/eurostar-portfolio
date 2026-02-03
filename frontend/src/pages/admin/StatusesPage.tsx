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

interface Status {
  id: number;
  name: string;
  color: string;
  displayOrder: number;
  usageCount: number;
  createdAt: string;
}

export function StatusesPage() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#006B6B');
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatuses = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<Status[]>('/api/admin/statuses');
      setStatuses(data);
    } catch (err) {
      console.error('Failed to fetch statuses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: formName.trim(),
        color: formColor,
        displayOrder: formDisplayOrder,
      };

      if (editingStatus) {
        await apiClient(`/api/admin/statuses/${editingStatus.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient('/api/admin/statuses', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setIsDialogOpen(false);
      setEditingStatus(null);
      resetForm();
      fetchStatuses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormColor('#006B6B');
    setFormDisplayOrder(0);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this status?')) return;

    try {
      await apiClient(`/api/admin/statuses/${id}`, { method: 'DELETE' });
      fetchStatuses();
    } catch (err) {
      console.error('Failed to delete status:', err);
    }
  };

  const openCreateDialog = () => {
    setEditingStatus(null);
    resetForm();
    // Set next display order
    const maxOrder = Math.max(0, ...statuses.map((s) => s.displayOrder));
    setFormDisplayOrder(maxOrder + 1);
    setError(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (status: Status) => {
    setEditingStatus(status);
    setFormName(status.name);
    setFormColor(status.color);
    setFormDisplayOrder(status.displayOrder);
    setError(null);
    setIsDialogOpen(true);
  };

  const columns: ColumnDef<Status>[] = [
    {
      accessorKey: 'displayOrder',
      header: '#',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.displayOrder}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: row.original.color }}
          />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'color',
      header: 'Color',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <code className="text-sm bg-gray-100 px-2 py-0.5 rounded">
            {row.original.color}
          </code>
        </div>
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
                : 'Delete status'
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
        <h1 className="text-2xl font-bold text-gray-900">Statuses</h1>
        <p className="text-muted-foreground mt-1">
          Manage project lifecycle statuses. Statuses are displayed in order.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={statuses}
        onAdd={openCreateDialog}
        addButtonLabel="Add Status"
        filterPlaceholder="Search statuses..."
        emptyMessage="No statuses found. Create your first status."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStatus ? 'Edit Status' : 'Add Status'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter status name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="h-10 w-16 rounded border border-input cursor-pointer"
                />
                <Input
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  placeholder="#RRGGBB"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                type="number"
                id="displayOrder"
                value={formDisplayOrder}
                onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first in lists
              </p>
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
              <Button type="submit" disabled={isSubmitting || !formName.trim()}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
