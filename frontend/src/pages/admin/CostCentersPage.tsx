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
import { BulkImportDialog } from '@/components/admin/BulkImportDialog';
import { Pencil, Trash2, Download, Upload, Plus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface CostCenter {
  id: number;
  code: string;
  description: string | null;
  usageCount: number;
  createdAt: string;
}

export function CostCentersPage() {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const fetchCostCenters = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<CostCenter[]>('/api/admin/cost-centers');
      setCostCenters(data);
    } catch (err) {
      console.error('Failed to fetch cost centers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCostCenters();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        code: formCode.trim().toUpperCase(),
        description: formDescription.trim() || null,
      };

      if (editingCostCenter) {
        await apiClient(`/api/admin/cost-centers/${editingCostCenter.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient('/api/admin/cost-centers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setIsDialogOpen(false);
      setEditingCostCenter(null);
      resetForm();
      fetchCostCenters();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormCode('');
    setFormDescription('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this cost center?')) return;

    try {
      await apiClient(`/api/admin/cost-centers/${id}`, { method: 'DELETE' });
      fetchCostCenters();
    } catch (err) {
      console.error('Failed to delete cost center:', err);
    }
  };

  const openCreateDialog = () => {
    setEditingCostCenter(null);
    resetForm();
    setError(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (costCenter: CostCenter) => {
    setEditingCostCenter(costCenter);
    setFormCode(costCenter.code);
    setFormDescription(costCenter.description || '');
    setError(null);
    setIsDialogOpen(true);
  };

  const handleExport = () => {
    const link = document.createElement('a');
    link.href = `${API_URL}/api/admin/cost-centers/export`;
    link.download = 'cost-centers.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<CostCenter>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <code className="font-mono font-medium bg-gray-100 px-2 py-0.5 rounded">
          {row.original.code}
        </code>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.description || '-'}
        </span>
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
                : 'Delete cost center'
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
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cost Centers</h1>
          <p className="text-muted-foreground mt-1">
            Manage accounting cost center codes for project budget allocation.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Cost Center
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={costCenters}
        filterPlaceholder="Search cost centers..."
        emptyMessage="No cost centers found. Create your first cost center."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCostCenter ? 'Edit Cost Center' : 'Add Cost Center'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                placeholder="e.g., IT-DEV-001"
                required
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier for the cost center
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="e.g., IT Development Team Budget"
              />
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
              <Button type="submit" disabled={isSubmitting || !formCode.trim()}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <BulkImportDialog
        referentialType="cost-centers"
        expectedColumns={['code', 'description']}
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={fetchCostCenters}
      />
    </div>
  );
}
