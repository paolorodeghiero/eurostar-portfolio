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

interface Department {
  id: number;
  name: string;
  usageCount: number;
  createdAt: string;
}

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formName, setFormName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<Department[]>('/api/admin/departments');
      setDepartments(data);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingDept) {
        await apiClient(`/api/admin/departments/${editingDept.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: formName.trim() }),
        });
      } else {
        await apiClient('/api/admin/departments', {
          method: 'POST',
          body: JSON.stringify({ name: formName.trim() }),
        });
      }
      setIsDialogOpen(false);
      setEditingDept(null);
      setFormName('');
      fetchDepartments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this department?')) return;

    try {
      await apiClient(`/api/admin/departments/${id}`, { method: 'DELETE' });
      fetchDepartments();
    } catch (err) {
      console.error('Failed to delete department:', err);
    }
  };

  const openCreateDialog = () => {
    setEditingDept(null);
    setFormName('');
    setError(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (dept: Department) => {
    setEditingDept(dept);
    setFormName(dept.name);
    setError(null);
    setIsDialogOpen(true);
  };

  const columns: ColumnDef<Department>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'usageCount',
      header: 'Usage',
      cell: ({ row }) => (
        <Badge variant={row.original.usageCount > 0 ? 'secondary' : 'outline'}>
          {row.original.usageCount} team(s)
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
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
                ? `Cannot delete: in use by ${row.original.usageCount} team(s)`
                : 'Delete department'
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
        <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
        <p className="text-muted-foreground mt-1">
          Manage organizational departments. Departments group teams together.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={departments}
        onAdd={openCreateDialog}
        addButtonLabel="Add Department"
        filterPlaceholder="Search departments..."
        emptyMessage="No departments found. Create your first department."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDept ? 'Edit Department' : 'Add Department'}
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
                placeholder="Enter department name"
                required
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
