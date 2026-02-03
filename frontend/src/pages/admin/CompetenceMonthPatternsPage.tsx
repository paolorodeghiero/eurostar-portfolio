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

const COMPANIES = [
  { value: 'THIF', label: 'THIF - Thalys/Eurostar France' },
  { value: 'EIL', label: 'EIL - Eurostar International Ltd' },
];

interface CompetenceMonthPattern {
  id: number;
  company: string;
  pattern: string;
  description: string | null;
  usageCount: number;
  createdAt: string;
}

export function CompetenceMonthPatternsPage() {
  const [patterns, setPatterns] = useState<CompetenceMonthPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState<CompetenceMonthPattern | null>(null);
  const [formCompany, setFormCompany] = useState('');
  const [formPattern, setFormPattern] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatterns = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<CompetenceMonthPattern[]>('/api/admin/competence-month-patterns');
      setPatterns(data);
    } catch (err) {
      console.error('Failed to fetch patterns:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatterns();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany || !formPattern.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        company: formCompany,
        pattern: formPattern.trim(),
        description: formDescription.trim() || null,
      };

      if (editingPattern) {
        await apiClient(`/api/admin/competence-month-patterns/${editingPattern.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient('/api/admin/competence-month-patterns', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setIsDialogOpen(false);
      setEditingPattern(null);
      resetForm();
      fetchPatterns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormCompany('');
    setFormPattern('');
    setFormDescription('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this pattern?')) return;

    try {
      await apiClient(`/api/admin/competence-month-patterns/${id}`, { method: 'DELETE' });
      fetchPatterns();
    } catch (err) {
      console.error('Failed to delete pattern:', err);
    }
  };

  const openCreateDialog = () => {
    setEditingPattern(null);
    resetForm();
    setError(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (pattern: CompetenceMonthPattern) => {
    setEditingPattern(pattern);
    setFormCompany(pattern.company);
    setFormPattern(pattern.pattern);
    setFormDescription(pattern.description || '');
    setError(null);
    setIsDialogOpen(true);
  };

  const columns: ColumnDef<CompetenceMonthPattern>[] = [
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.company}</Badge>
      ),
    },
    {
      accessorKey: 'pattern',
      header: 'Pattern',
      cell: ({ row }) => (
        <code className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">
          {row.original.pattern}
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
                : 'Delete pattern'
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
        <h1 className="text-2xl font-bold text-gray-900">Competence Month Patterns</h1>
        <p className="text-muted-foreground mt-1">
          Manage month patterns for competence periods by company.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={patterns}
        onAdd={openCreateDialog}
        addButtonLabel="Add Pattern"
        filterPlaceholder="Search patterns..."
        emptyMessage="No patterns found. Create your first pattern."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPattern ? 'Edit Pattern' : 'Add Pattern'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company">
                Company <span className="text-red-500">*</span>
              </Label>
              <select
                id="company"
                value={formCompany}
                onChange={(e) => setFormCompany(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select company...</option>
                {COMPANIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pattern">
                Pattern <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pattern"
                value={formPattern}
                onChange={(e) => setFormPattern(e.target.value)}
                placeholder="e.g., Jan-Dec or Apr-Mar"
                required
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Month range pattern for the competence period
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="e.g., Calendar year or UK fiscal year"
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
                disabled={isSubmitting || !formCompany || !formPattern.trim()}
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
