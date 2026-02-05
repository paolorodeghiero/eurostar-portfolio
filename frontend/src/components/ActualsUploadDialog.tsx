import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Upload, Download, ChevronDown } from 'lucide-react';
import { uploadReceiptsExcel, uploadInvoicesExcel, type ImportResult } from '@/lib/actuals-api';

interface ActualsUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: () => void;
}

export function ActualsUploadDialog({ open, onOpenChange, onUploadComplete }: ActualsUploadDialogProps) {
  const [receiptsFile, setReceiptsFile] = useState<File | null>(null);
  const [invoicesFile, setInvoicesFile] = useState<File | null>(null);
  const [receiptsResult, setReceiptsResult] = useState<ImportResult | null>(null);
  const [invoicesResult, setInvoicesResult] = useState<ImportResult | null>(null);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [receiptsError, setReceiptsError] = useState<string | null>(null);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);
  const [receiptsDocsOpen, setReceiptsDocsOpen] = useState(false);
  const [invoicesDocsOpen, setInvoicesDocsOpen] = useState(false);

  const handleReceiptsUpload = async () => {
    if (!receiptsFile) return;

    setReceiptsLoading(true);
    setReceiptsError(null);
    setReceiptsResult(null);

    try {
      const result = await uploadReceiptsExcel(receiptsFile);
      setReceiptsResult(result);
      if (result.imported > 0) {
        onUploadComplete?.();
      }
    } catch (error) {
      setReceiptsError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setReceiptsLoading(false);
    }
  };

  const handleInvoicesUpload = async () => {
    if (!invoicesFile) return;

    setInvoicesLoading(true);
    setInvoicesError(null);
    setInvoicesResult(null);

    try {
      const result = await uploadInvoicesExcel(invoicesFile);
      setInvoicesResult(result);
      if (result.imported > 0) {
        onUploadComplete?.();
      }
    } catch (error) {
      setInvoicesError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setInvoicesLoading(false);
    }
  };

  const resetReceipts = () => {
    setReceiptsFile(null);
    setReceiptsResult(null);
    setReceiptsError(null);
  };

  const resetInvoices = () => {
    setInvoicesFile(null);
    setInvoicesResult(null);
    setInvoicesError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Upload Actuals</DialogTitle>
          <DialogDescription>
            Import receipts and invoices from Excel files
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="receipts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="receipts">Receipts</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>

          <TabsContent value="receipts" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="receipts-file">Excel File (.xlsx, .xls)</Label>
              <Input
                id="receipts-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  setReceiptsFile(e.target.files?.[0] || null);
                  setReceiptsResult(null);
                  setReceiptsError(null);
                }}
                disabled={receiptsLoading}
              />
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground flex-1">
                  Upload receipts data from Excel
                </p>
                <a
                  href="/api/actuals/receipts/template"
                  download
                  className="inline-flex items-center gap-1 text-xs text-eurostar-teal hover:text-eurostar-teal/80 font-medium"
                >
                  <Download className="h-3 w-3" />
                  Download Template
                </a>
              </div>
            </div>

            <Collapsible open={receiptsDocsOpen} onOpenChange={setReceiptsDocsOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-eurostar-teal">
                <ChevronDown className={`h-4 w-4 transition-transform ${receiptsDocsOpen ? '' : '-rotate-90'}`} />
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
                        <td className="px-3 py-2 font-mono">ProjectId</td>
                        <td className="px-3 py-2">Text</td>
                        <td className="px-3 py-2">Yes</td>
                        <td className="px-3 py-2">Format: PRJ-YYYY-XXXXX</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-3 py-2 font-mono">ReceiptNumber</td>
                        <td className="px-3 py-2">Text</td>
                        <td className="px-3 py-2">Yes</td>
                        <td className="px-3 py-2">Unique receipt reference</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-3 py-2 font-mono">Company</td>
                        <td className="px-3 py-2">Text</td>
                        <td className="px-3 py-2">Yes</td>
                        <td className="px-3 py-2">Company code (e.g., THIF, EIL)</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-3 py-2 font-mono">PurchaseOrder</td>
                        <td className="px-3 py-2">Text</td>
                        <td className="px-3 py-2">Yes</td>
                        <td className="px-3 py-2">Purchase order reference</td>
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
                        <td className="px-3 py-2">3-letter ISO code</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-3 py-2 font-mono">Date</td>
                        <td className="px-3 py-2">Text</td>
                        <td className="px-3 py-2">Yes</td>
                        <td className="px-3 py-2">Format: YYYY-MM-DD</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-3 py-2 font-mono">Description</td>
                        <td className="px-3 py-2">Text</td>
                        <td className="px-3 py-2">No</td>
                        <td className="px-3 py-2">Optional description</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Button
              onClick={handleReceiptsUpload}
              disabled={!receiptsFile || receiptsLoading}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {receiptsLoading ? 'Uploading...' : 'Upload Receipts'}
            </Button>

            {receiptsError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{receiptsError}</AlertDescription>
              </Alert>
            )}

            {receiptsResult && (
              <div className="space-y-3">
                <Alert variant="default" className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Successfully imported {receiptsResult.imported} receipt{receiptsResult.imported !== 1 ? 's' : ''}
                  </AlertDescription>
                </Alert>

                {receiptsResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-destructive">
                      Errors ({receiptsResult.errors.length}):
                    </p>
                    <div className="max-h-40 overflow-auto space-y-1 text-sm">
                      {receiptsResult.errors.map((error, idx) => (
                        <div key={idx} className="text-destructive">
                          {error.row ? `Row ${error.row}` : error.index !== undefined ? `Index ${error.index}` : 'Error'}: {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button variant="outline" onClick={resetReceipts} className="w-full">
                  Upload Another File
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoices-file">Excel File (.xlsx, .xls)</Label>
              <Input
                id="invoices-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  setInvoicesFile(e.target.files?.[0] || null);
                  setInvoicesResult(null);
                  setInvoicesError(null);
                }}
                disabled={invoicesLoading}
              />
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground flex-1">
                  Upload invoices data from Excel
                </p>
                <a
                  href="/api/actuals/invoices/template"
                  download
                  className="inline-flex items-center gap-1 text-xs text-eurostar-teal hover:text-eurostar-teal/80 font-medium"
                >
                  <Download className="h-3 w-3" />
                  Download Template
                </a>
              </div>
            </div>

            <Collapsible open={invoicesDocsOpen} onOpenChange={setInvoicesDocsOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-eurostar-teal">
                <ChevronDown className={`h-4 w-4 transition-transform ${invoicesDocsOpen ? '' : '-rotate-90'}`} />
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
                        <td className="px-3 py-2 font-mono">InvoiceNumber</td>
                        <td className="px-3 py-2">Text</td>
                        <td className="px-3 py-2">Yes</td>
                        <td className="px-3 py-2">Unique per company</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-3 py-2 font-mono">PurchaseOrder</td>
                        <td className="px-3 py-2">Text</td>
                        <td className="px-3 py-2">Yes</td>
                        <td className="px-3 py-2">Purchase order reference</td>
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
                        <td className="px-3 py-2">3-letter ISO code</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-3 py-2 font-mono">Date</td>
                        <td className="px-3 py-2">Text</td>
                        <td className="px-3 py-2">Yes</td>
                        <td className="px-3 py-2">Format: YYYY-MM-DD</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-3 py-2 font-mono">CompetenceMonth</td>
                        <td className="px-3 py-2">Text</td>
                        <td className="px-3 py-2">No</td>
                        <td className="px-3 py-2">Format: YYYY-MM</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-3 py-2 font-mono">Description</td>
                        <td className="px-3 py-2">Text</td>
                        <td className="px-3 py-2">No</td>
                        <td className="px-3 py-2">Optional description</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Button
              onClick={handleInvoicesUpload}
              disabled={!invoicesFile || invoicesLoading}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {invoicesLoading ? 'Uploading...' : 'Upload Invoices'}
            </Button>

            {invoicesError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{invoicesError}</AlertDescription>
              </Alert>
            )}

            {invoicesResult && (
              <div className="space-y-3">
                <Alert variant="default" className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Successfully imported {invoicesResult.imported} invoice{invoicesResult.imported !== 1 ? 's' : ''}
                  </AlertDescription>
                </Alert>

                {invoicesResult.extractionWarnings !== undefined && invoicesResult.extractionWarnings > 0 && (
                  <Alert variant="default" className="border-orange-500 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      Warning: {invoicesResult.extractionWarnings} invoice{invoicesResult.extractionWarnings !== 1 ? 's' : ''} need competence month review
                    </AlertDescription>
                  </Alert>
                )}

                {invoicesResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-destructive">
                      Errors ({invoicesResult.errors.length}):
                    </p>
                    <div className="max-h-40 overflow-auto space-y-1 text-sm">
                      {invoicesResult.errors.map((error, idx) => (
                        <div key={idx} className="text-destructive">
                          {error.row ? `Row ${error.row}` : error.index !== undefined ? `Index ${error.index}` : 'Error'}: {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button variant="outline" onClick={resetInvoices} className="w-full">
                  Upload Another File
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
