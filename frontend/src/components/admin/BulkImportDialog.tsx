import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAccessToken } from '@/lib/api-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface BulkImportDialogProps {
  referentialType: string; // 'departments', 'teams', etc.
  expectedColumns: string[]; // ['name'] for departments
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void; // Called after successful import to refresh data
}

export function BulkImportDialog({
  referentialType,
  expectedColumns,
  open,
  onOpenChange,
  onSuccess,
}: BulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    imported?: number;
    errors?: string[];
  } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
      ];
      if (
        !validTypes.includes(selected.type) &&
        !selected.name.endsWith('.xlsx') &&
        !selected.name.endsWith('.csv')
      ) {
        setResult({
          success: false,
          errors: ['Please select an Excel (.xlsx) or CSV file'],
        });
        return;
      }
      setFile(selected);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = await getAccessToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/admin/${referentialType}/import`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, imported: data.imported });
        onSuccess();
      } else {
        setResult({
          success: false,
          errors: data.errors || [data.error || 'Import failed'],
        });
      }
    } catch (error) {
      setResult({
        success: false,
        errors: ['Network error. Please try again.'],
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import {referentialType}</DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx) or CSV file with {referentialType} data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Expected columns info */}
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium mb-1">Expected columns:</p>
            <p className="text-sm text-muted-foreground">
              {expectedColumns.join(', ')}
            </p>
          </div>

          {/* File input */}
          <div className="space-y-2">
            <Label htmlFor="file">Select file</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Result display */}
          {result && (
            <div
              className={`p-3 rounded-md ${
                result.success
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {result.success ? (
                <p>Successfully imported {result.imported} item(s).</p>
              ) : (
                <div>
                  <p className="font-medium mb-1">Import failed:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {result.errors?.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result?.success ? 'Close' : 'Cancel'}
          </Button>
          {!result?.success && (
            <Button onClick={handleUpload} disabled={!file || isUploading}>
              {isUploading ? 'Importing...' : 'Import'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
