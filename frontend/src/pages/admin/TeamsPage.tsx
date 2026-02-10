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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { BulkImportDialog } from '@/components/admin/BulkImportDialog';
import { UsageDrawer } from '@/components/admin/UsageDrawer';
import { Pencil, Trash2, Download, Upload, Plus, Eye } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Department {
  id: number;
  name: string;
}

interface Team {
  id: number;
  name: string;
  description: string | null;
  departmentId: number;
  departmentName: string;
  usageCount: number;
  createdAt: string;
}

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDepartmentId, setFormDepartmentId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [usageDrawerOpen, setUsageDrawerOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<Team[]>('/api/admin/teams');
      setTeams(data);
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await apiClient<Department[]>('/api/admin/departments');
      setDepartments(data);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDepartmentId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        departmentId: formDepartmentId,
      };

      if (editingTeam) {
        await apiClient(`/api/admin/teams/${editingTeam.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient('/api/admin/teams', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setIsDialogOpen(false);
      setEditingTeam(null);
      resetForm();
      fetchTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormDepartmentId('');
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient(`/api/admin/teams/${id}`, { method: 'DELETE' });
      fetchTeams();
    } catch (err) {
      console.error('Failed to delete team:', err);
    }
  };

  const openCreateDialog = () => {
    setEditingTeam(null);
    resetForm();
    setError(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (team: Team) => {
    setEditingTeam(team);
    setFormName(team.name);
    setFormDescription(team.description || '');
    setFormDepartmentId(team.departmentId);
    setError(null);
    setIsDialogOpen(true);
  };

  const openUsageDrawer = (team: Team) => {
    setSelectedTeam(team);
    setUsageDrawerOpen(true);
  };

  const handleExport = () => {
    const link = document.createElement('a');
    link.href = `${API_URL}/api/admin/teams/export`;
    link.download = 'teams.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<Team>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'departmentName',
      header: 'Department',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.departmentName}</Badge>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
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
                    ? `Cannot delete: in use by ${row.original.usageCount} project(s)`
                    : 'Delete team'
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
                  This action cannot be undone. This team will be permanently
                  deleted from the system.
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
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-muted-foreground mt-1">
            Manage teams within departments. Teams are assigned to projects.
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
            Add Team
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={teams}
        filterPlaceholder="Search teams..."
        emptyMessage="No teams found. Create your first team."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTeam ? 'Edit Team' : 'Add Team'}
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
                placeholder="Enter team name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">
                Department <span className="text-red-500">*</span>
              </Label>
              <select
                id="department"
                value={formDepartmentId}
                onChange={(e) =>
                  setFormDepartmentId(
                    e.target.value ? Number(e.target.value) : ''
                  )
                }
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select department...</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Enter team description (optional)"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
              <Button
                type="submit"
                disabled={isSubmitting || !formName.trim() || !formDepartmentId}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <BulkImportDialog
        referentialType="teams"
        expectedColumns={['name', 'departmentName', 'description']}
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={fetchTeams}
      />

      <UsageDrawer
        referentialType="teams"
        referentialId={selectedTeam?.id || 0}
        referentialName={selectedTeam?.name || ''}
        open={usageDrawerOpen}
        onOpenChange={setUsageDrawerOpen}
      />
    </div>
  );
}
