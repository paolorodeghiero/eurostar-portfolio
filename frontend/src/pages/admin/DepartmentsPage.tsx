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
import { UsageDrawer } from '@/components/admin/UsageDrawer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Download, Upload, Plus, Eye } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [usageDrawerOpen, setUsageDrawerOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

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
    try {
      await apiClient(`/api/admin/departments/${id}`, { method: 'DELETE' });
      fetchDepartments();
    } catch (err) {
      console.error('Failed to delete department:', err);
    }
  };

  const openUsageDrawer = (dept: Department) => {
    setSelectedDept(dept);
    setUsageDrawerOpen(true);
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

  const handleExport = () => {
    const link = document.createElement('a');
    link.href = `${API_URL}/api/admin/departments/export`;
    link.download = 'departments.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      cell: ({ row}) => (
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openUsageDrawer(row.original)}
            title="View usage"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditDialog(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
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
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {row.original.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This department will be
                  permanently deleted from the system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(row.original.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-muted-foreground mt-1">
            Manage organizational departments. Departments group teams together.
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
            Add Department
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={departments}
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

      <BulkImportDialog
        referentialType="departments"
        expectedColumns={['name']}
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={fetchDepartments}
      />

      <UsageDrawer
        referentialType="departments"
        referentialId={selectedDept?.id || 0}
        referentialName={selectedDept?.name || ''}
        open={usageDrawerOpen}
        onOpenChange={setUsageDrawerOpen}
      />
    </div>
  );
}
