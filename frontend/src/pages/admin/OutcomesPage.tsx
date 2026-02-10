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

interface Outcome {
  id: number;
  name: string;
  score1Example: string | null;
  score2Example: string | null;
  score3Example: string | null;
  score4Example: string | null;
  score5Example: string | null;
  usageCount: number;
  createdAt: string;
}

export function OutcomesPage() {
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOutcome, setEditingOutcome] = useState<Outcome | null>(null);
  const [formName, setFormName] = useState('');
  const [formScore1, setFormScore1] = useState('');
  const [formScore2, setFormScore2] = useState('');
  const [formScore3, setFormScore3] = useState('');
  const [formScore4, setFormScore4] = useState('');
  const [formScore5, setFormScore5] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const fetchOutcomes = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<Outcome[]>('/api/admin/outcomes');
      setOutcomes(data);
    } catch (err) {
      console.error('Failed to fetch outcomes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOutcomes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: formName.trim(),
        score1Example: formScore1.trim() || null,
        score2Example: formScore2.trim() || null,
        score3Example: formScore3.trim() || null,
        score4Example: formScore4.trim() || null,
        score5Example: formScore5.trim() || null,
      };

      if (editingOutcome) {
        await apiClient(`/api/admin/outcomes/${editingOutcome.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient('/api/admin/outcomes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setIsDialogOpen(false);
      setEditingOutcome(null);
      resetForm();
      fetchOutcomes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormScore1('');
    setFormScore2('');
    setFormScore3('');
    setFormScore4('');
    setFormScore5('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this outcome?')) return;

    try {
      await apiClient(`/api/admin/outcomes/${id}`, { method: 'DELETE' });
      fetchOutcomes();
    } catch (err) {
      console.error('Failed to delete outcome:', err);
    }
  };

  const openCreateDialog = () => {
    setEditingOutcome(null);
    resetForm();
    setError(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (outcome: Outcome) => {
    setEditingOutcome(outcome);
    setFormName(outcome.name);
    setFormScore1(outcome.score1Example || '');
    setFormScore2(outcome.score2Example || '');
    setFormScore3(outcome.score3Example || '');
    setFormScore4(outcome.score4Example || '');
    setFormScore5(outcome.score5Example || '');
    setError(null);
    setIsDialogOpen(true);
  };

  const handleExport = () => {
    const link = document.createElement('a');
    link.href = `${API_URL}/api/admin/outcomes/export`;
    link.download = 'outcomes.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<Outcome>[] = [
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
          {row.original.usageCount} project(s)
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
                ? `Cannot delete: in use by ${row.original.usageCount} project(s)`
                : 'Delete outcome'
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
          <h1 className="text-2xl font-bold text-gray-900">Outcomes</h1>
          <p className="text-muted-foreground mt-1">
            Manage outcome criteria with example descriptions for each score level (1-5).
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
            Add Outcome
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={outcomes}
        filterPlaceholder="Search outcomes..."
        emptyMessage="No outcomes found. Create your first outcome."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOutcome ? 'Edit Outcome' : 'Add Outcome'}
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
                placeholder="e.g., Customer Satisfaction"
                required
              />
            </div>

            <div className="space-y-3">
              <Label>Score Examples</Label>
              <p className="text-xs text-muted-foreground">
                Provide example descriptions for each score level to guide evaluation.
              </p>

              <div className="space-y-2">
                <Label htmlFor="score1" className="text-sm">
                  Score 1 (Lowest)
                </Label>
                <textarea
                  id="score1"
                  value={formScore1}
                  onChange={(e) => setFormScore1(e.target.value)}
                  placeholder="Example of what warrants a score of 1..."
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="score2" className="text-sm">
                  Score 2
                </Label>
                <textarea
                  id="score2"
                  value={formScore2}
                  onChange={(e) => setFormScore2(e.target.value)}
                  placeholder="Example of what warrants a score of 2..."
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="score3" className="text-sm">
                  Score 3 (Middle)
                </Label>
                <textarea
                  id="score3"
                  value={formScore3}
                  onChange={(e) => setFormScore3(e.target.value)}
                  placeholder="Example of what warrants a score of 3..."
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="score4" className="text-sm">
                  Score 4
                </Label>
                <textarea
                  id="score4"
                  value={formScore4}
                  onChange={(e) => setFormScore4(e.target.value)}
                  placeholder="Example of what warrants a score of 4..."
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="score5" className="text-sm">
                  Score 5 (Highest)
                </Label>
                <textarea
                  id="score5"
                  value={formScore5}
                  onChange={(e) => setFormScore5(e.target.value)}
                  placeholder="Example of what warrants a score of 5..."
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
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
              <Button type="submit" disabled={isSubmitting || !formName.trim()}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <BulkImportDialog
        referentialType="outcomes"
        expectedColumns={['name', 'score1Example', 'score2Example', 'score3Example', 'score4Example', 'score5Example']}
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={fetchOutcomes}
      />
    </div>
  );
}
