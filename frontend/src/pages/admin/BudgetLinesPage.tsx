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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Upload, Trash2, Download, ChevronDown } from 'lucide-react';
import {
  BudgetLine,
  fetchBudgetLines,
  importBudgetLines,
  deleteBudgetLine,
  ImportResult,
} from '@/lib/budget-lines-api';

export function BudgetLinesPage() {
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingLine, setDeletingLine] = useState<BudgetLine | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  // Filter state
  const currentYear = new Date().getFullYear();
  const [fiscalYear, setFiscalYear] = useState<number>(currentYear);
  const [company, setCompany] = useState<string>('all');
  const [type, setType] = useState<string>('all');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const filters: {
        fiscalYear?: number;
        company?: string;
        type?: 'CAPEX' | 'OPEX';
      } = {
        fiscalYear,
      };
      if (company !== 'all') filters.company = company;
      if (type !== 'all') filters.type = type as 'CAPEX' | 'OPEX';

      const data = await fetchBudgetLines(filters);
      setBudgetLines(data);
    } catch (err) {
      console.error('Failed to fetch budget lines:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fiscalYear, company, type]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsSubmitting(true);
    setError(null);
    setImportResult(null);

    try {
      const result = await importBudgetLines(selectedFile);
      setImportResult(result);

      if (result.errors.length === 0) {
        // Success - close dialog after short delay
        setTimeout(() => {
          setIsImportDialogOpen(false);
          setSelectedFile(null);
          setImportResult(null);
          fetchData();
        }, 2000);
      } else {
        // Has errors - keep dialog open to show them
        fetchData(); // Refresh to show any successful imports
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingLine) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await deleteBudgetLine(deletingLine.id);
      setIsDeleteDialogOpen(false);
      setDeletingLine(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (line: BudgetLine) => {
    setDeletingLine(line);
    setError(null);
    setIsDeleteDialogOpen(true);
  };

  const openImportDialog = () => {
    setSelectedFile(null);
    setError(null);
    setImportResult(null);
    setIsImportDialogOpen(true);
  };

  const formatCurrency = (amount: string, currency: string) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  const columns: ColumnDef<BudgetLine>[] = [
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.company}</span>
      ),
    },
    {
      accessorKey: 'departmentName',
      header: 'Department',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.departmentName}</span>
      ),
    },
    {
      accessorKey: 'costCenterCode',
      header: 'Cost Center',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.costCenterCode}</span>
      ),
    },
    {
      accessorKey: 'lineValue',
      header: 'Line Value',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.lineValue}</span>
      ),
    },
    {
      accessorKey: 'lineAmount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.original.lineAmount, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant={row.original.type === 'CAPEX' ? 'default' : 'secondary'}>
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: 'fiscalYear',
      header: 'FY',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.fiscalYear}</span>
      ),
    },
    {
      accessorKey: 'allocatedAmount',
      header: 'Allocated',
      cell: ({ row }) => (
        <span className="text-sm">
          {formatCurrency(row.original.allocatedAmount, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: 'availableAmount',
      header: 'Available',
      cell: ({ row }) => {
        const available = parseFloat(row.original.availableAmount);
        return (
          <span
            className={`text-sm font-medium ${
              available <= 0 ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {formatCurrency(row.original.availableAmount, row.original.currency)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const hasAllocations = parseFloat(row.original.allocatedAmount) > 0;
        return (
          <div className="flex gap-1 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openDeleteDialog(row.original)}
              disabled={hasAllocations}
              title={
                hasAllocations
                  ? `Cannot delete: has ${formatCurrency(
                      row.original.allocatedAmount,
                      row.original.currency
                    )} allocated`
                  : 'Delete budget line'
              }
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
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
        <h1 className="text-2xl font-bold text-gray-900">Budget Lines</h1>
        <p className="text-muted-foreground mt-1">
          Manage budget lines and import from Excel. Budget lines track allocated and available amounts.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="w-40">
          <Label htmlFor="fiscalYear" className="text-sm">
            Fiscal Year
          </Label>
          <Select
            value={fiscalYear.toString()}
            onValueChange={(val) => setFiscalYear(parseInt(val))}
          >
            <SelectTrigger id="fiscalYear">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-40">
          <Label htmlFor="company" className="text-sm">
            Company
          </Label>
          <Select value={company} onValueChange={setCompany}>
            <SelectTrigger id="company">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="THIF">THIF</SelectItem>
              <SelectItem value="EIL">EIL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-40">
          <Label htmlFor="type" className="text-sm">
            Type
          </Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="CAPEX">CAPEX</SelectItem>
              <SelectItem value="OPEX">OPEX</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto self-end">
          <Button onClick={openImportDialog}>
            <Upload className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={budgetLines}
        filterPlaceholder="Search budget lines..."
        emptyMessage="No budget lines found. Import an Excel file to add budget lines."
      />

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Budget Lines</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">
                Excel File <span className="text-red-500">*</span>
              </Label>
              <input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-eurostar-teal file:text-white
                  hover:file:bg-eurostar-teal/90
                  cursor-pointer"
              />
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground flex-1">
                  Upload an Excel file (.xlsx or .xls) with budget line data.
                </p>
                <a
                  href="/api/admin/budget-lines/template"
                  download
                  className="inline-flex items-center gap-1 text-xs text-eurostar-teal hover:text-eurostar-teal/80 font-medium"
                >
                  <Download className="h-3 w-3" />
                  Download Template
                </a>
              </div>
            </div>

            <Collapsible open={isDocsOpen} onOpenChange={setIsDocsOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-eurostar-teal">
                <ChevronDown className={`h-4 w-4 transition-transform ${isDocsOpen ? '' : '-rotate-90'}`} />
                Column Documentation
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Column</th>
                        <th className="text-left px-3 py-2 font-medium">Type</th>
                        <th className="text-left px-3 py-2 font-medium">Required</th>
                        <th className="text-left px-3 py-2 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-t">
                        <td className="px-3 py-2 font-mono">Company</td>
                        <td className="px-3 py-2">Text</td>
                        <td className="px-3 py-2">Yes</td>
                        <td className="px-3 py-2">Company code (e.g., THIF, EIL)</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-3 py-2 font-mono">Department</td>
                        <td className="px-3 py-2">Text</td>
                        <td className="px-3 py-2">Yes</td>
                        <td className="px-3 py-2">Must match existing department name</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-3 py-2 font-mono">CostCenter</td>
                        <td className="px-3 py-2">Text</td>
                        <td className="px-3 py-2">Yes</td>
                        <td className="px-3 py-2">Must match existing cost center code</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-3 py-2 font-mono">LineValue</td>
                        <td className="px-3 py-2">Text</td>
                        <td className="px-3 py-2">Yes</td>
                        <td className="px-3 py-2">Budget line identifier</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-3 py-2 font-mono">Amount</td>
                        <td className="px-3 py-2">Number</td>
                        <td className="px-3 py-2">Yes</td>
                        <td className="px-3 py-2">Positive number</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-3 py-2 font-mono">Currency</td>
                        <td className="px-3 py-2">Text</td>
                        <td className="px-3 py-2">Yes</td>
                        <td className="px-3 py-2">3-letter ISO code (EUR, GBP, USD)</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-3 py-2 font-mono">Type</td>
                        <td className="px-3 py-2">Text</td>
                        <td className="px-3 py-2">Yes</td>
                        <td className="px-3 py-2">CAPEX or OPEX</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-3 py-2 font-mono">FiscalYear</td>
                        <td className="px-3 py-2">Number</td>
                        <td className="px-3 py-2">Yes</td>
                        <td className="px-3 py-2">Year (2020-2100)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {importResult && (
              <div className="space-y-2">
                <div
                  className={`text-sm p-3 rounded ${
                    importResult.errors.length === 0
                      ? 'bg-green-50 text-green-800'
                      : 'bg-yellow-50 text-yellow-800'
                  }`}
                >
                  Successfully imported {importResult.imported} budget line(s).
                </div>

                {importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-red-600">
                      {importResult.errors.length} error(s) found:
                    </p>
                    <div className="max-h-48 overflow-y-auto bg-red-50 p-3 rounded text-sm space-y-1">
                      {importResult.errors.map((err, idx) => (
                        <div key={idx} className="text-red-800">
                          <span className="font-medium">Row {err.row}:</span> {err.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsImportDialogOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={handleImport}
                disabled={!selectedFile || isSubmitting}
              >
                {isSubmitting ? 'Importing...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Budget Line</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {deletingLine && (
              <div className="space-y-2 text-sm">
                <p>Are you sure you want to delete this budget line?</p>
                <div className="bg-gray-50 p-3 rounded space-y-1">
                  <div>
                    <span className="font-medium">Company:</span> {deletingLine.company}
                  </div>
                  <div>
                    <span className="font-medium">Department:</span>{' '}
                    {deletingLine.departmentName}
                  </div>
                  <div>
                    <span className="font-medium">Cost Center:</span>{' '}
                    {deletingLine.costCenterCode}
                  </div>
                  <div>
                    <span className="font-medium">Line Value:</span> {deletingLine.lineValue}
                  </div>
                  <div>
                    <span className="font-medium">Amount:</span>{' '}
                    {formatCurrency(deletingLine.lineAmount, deletingLine.currency)}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
