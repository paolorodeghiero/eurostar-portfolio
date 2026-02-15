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
import { Checkbox } from '@/components/ui/checkbox';
import { apiClient } from '@/lib/api-client';
import { Pencil, Trash2 } from 'lucide-react';

interface CommitteeLevel {
  id: number;
  name: string;
  mandatory: boolean;
  displayOrder: number;
  usageCount: number;
  createdAt: string;
}

export function CommitteeLevelsPage() {
  const [levels, setLevels] = useState<CommitteeLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<CommitteeLevel | null>(null);
  const [formName, setFormName] = useState('');
  const [formMandatory, setFormMandatory] = useState(false);
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLevels = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<CommitteeLevel[]>('/api/admin/committee-levels');
      setLevels(data);
    } catch (err) {
      console.error('Failed to fetch levels:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: formName,
        mandatory: formMandatory,
        displayOrder: formDisplayOrder,
      };

      if (editingLevel) {
        await apiClient(`/api/admin/committee-levels/${editingLevel.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient('/api/admin/committee-levels', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setIsDialogOpen(false);
      setEditingLevel(null);
      resetForm();
      fetchLevels();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormMandatory(false);
    setFormDisplayOrder(1);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this committee level?')) return;

    try {
      await apiClient(`/api/admin/committee-levels/${id}`, { method: 'DELETE' });
      fetchLevels();
    } catch (err) {
      console.error('Failed to delete level:', err);
    }
  };

  const openCreateDialog = () => {
    setEditingLevel(null);
    resetForm();
    setError(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (level: CommitteeLevel) => {
    setEditingLevel(level);
    setFormName(level.name);
    setFormMandatory(level.mandatory);
    setFormDisplayOrder(level.displayOrder);
    setError(null);
    setIsDialogOpen(true);
  };

  const columns: ColumnDef<CommitteeLevel>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'mandatory',
      header: 'Mandatory',
      cell: ({ row }) => (
        <Badge variant={row.original.mandatory ? 'default' : 'secondary'}>
          {row.original.mandatory ? 'Required' : 'Optional'}
        </Badge>
      ),
    },
    {
      accessorKey: 'displayOrder',
      header: 'Display Order',
      cell: ({ row }) => (
        <span className="font-mono text-muted-foreground">
          {row.original.displayOrder}
        </span>
      ),
    },
    {
      accessorKey: 'usageCount',
      header: 'Usage',
      cell: ({ row }) => (
        <Badge variant={row.original.usageCount > 0 ? 'secondary' : 'outline'}>
          {row.original.usageCount} threshold(s)
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
                ? `Cannot delete: used by ${row.original.usageCount} threshold(s)`
                : 'Delete level'
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
        <h1 className="text-2xl font-bold text-gray-900">Committee Levels</h1>
        <p className="text-muted-foreground mt-1">
          Manage committee engagement levels with mandatory flag for alerting.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={levels}
        onAdd={openCreateDialog}
        addButtonLabel="Add Level"
        filterPlaceholder="Search levels..."
        emptyMessage="No committee levels found. Create your first level."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLevel ? 'Edit Committee Level' : 'Add Committee Level'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                placeholder="e.g. mandatory, optional, not_necessary"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mandatory"
                  checked={formMandatory}
                  onCheckedChange={(checked) => setFormMandatory(checked === true)}
                />
                <Label htmlFor="mandatory" className="cursor-pointer">
                  Committee engagement is mandatory
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                When checked, projects at this level must engage with committee (used for alerts).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayOrder">
                Display Order <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                id="displayOrder"
                value={formDisplayOrder}
                onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                min={1}
                required
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Order in which levels are displayed (lower numbers appear first).
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
              <Button
                type="submit"
                disabled={isSubmitting || !formName}
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
