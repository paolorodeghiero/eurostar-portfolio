import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Trash2, Download } from 'lucide-react';
import { Receipt, Invoice, exportActualsExcel } from '@/lib/actuals-api';

interface ActualsTableProps {
  receipts: Receipt[];
  invoices: Invoice[];
  projectId: string;
  reportCurrency: string | null;
  onDelete: (type: 'receipt' | 'invoice', id: number) => void;
  disabled?: boolean;
}

export function ActualsTable({
  receipts,
  invoices,
  projectId,
  reportCurrency,
  onDelete,
  disabled = false,
}: ActualsTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Combine receipts and invoices into single list for virtualization
  const allItems = [
    ...receipts.map(r => ({ type: 'receipt' as const, data: r })),
    ...invoices.map(i => ({ type: 'invoice' as const, data: i }))
  ];

  const rowVirtualizer = useVirtualizer({
    count: allItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });

  const formatCurrency = (amount: string, currency: string) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleExport = () => {
    exportActualsExcel(receipts, invoices, projectId);
  };

  if (allItems.length === 0) {
    return (
      <div className="border-t p-4 text-center text-sm text-muted-foreground">
        No actuals recorded
      </div>
    );
  }

  return (
    <div className="border-t">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <h4 className="text-sm font-semibold">Detailed Actuals</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExport}
          className="text-xs"
        >
          <Download className="h-3 w-3 mr-1" />
          Export Excel
        </Button>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[100px_120px_1fr_120px_80px] gap-2 px-3 py-2 bg-gray-50 border-b text-xs font-medium text-muted-foreground">
        <div>Type</div>
        <div>Date</div>
        <div>Description</div>
        <div className="text-right">Amount</div>
        <div className="text-right">Actions</div>
      </div>

      {/* Virtualized List */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: '300px' }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const item = allItems[virtualItem.index];
            const isReceipt = item.type === 'receipt';
            const data = item.data as Receipt | Invoice;

            return (
              <div
                key={virtualItem.key}
                className="grid grid-cols-[100px_120px_1fr_120px_80px] gap-2 px-3 py-2 border-b text-sm hover:bg-gray-50"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {/* Type */}
                <div className="text-xs">
                  <span className={`inline-block px-2 py-0.5 rounded ${
                    isReceipt ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {isReceipt ? 'Receipt' : 'Invoice'}
                  </span>
                </div>

                {/* Date */}
                <div className="text-xs text-muted-foreground">
                  {formatDate(isReceipt ? (data as Receipt).receiptDate : (data as Invoice).invoiceDate)}
                </div>

                {/* Description */}
                <div className="truncate text-xs">
                  <div className="font-medium">
                    {isReceipt
                      ? ((data as Receipt).receiptNumber || 'No number')
                      : (data as Invoice).invoiceNumber
                    }
                  </div>
                  <div className="text-muted-foreground truncate">
                    {data.description || 'No description'}
                  </div>
                  {!isReceipt && (data as Invoice).competenceMonth && (
                    <div className="text-xs text-muted-foreground">
                      Month: {(data as Invoice).competenceMonthOverride || (data as Invoice).competenceMonth}
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div className="text-right text-xs">
                  <div className="font-medium">
                    {formatCurrency(data.amount, data.currency)}
                  </div>
                  {reportCurrency && reportCurrency !== data.currency && (
                    <div className="text-xs text-muted-foreground">
                      (in {reportCurrency})
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(item.type, data.id)}
                    disabled={disabled}
                    className="text-destructive hover:text-destructive h-7 w-7 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Summary */}
      <div className="px-3 py-2 bg-gray-50 border-t text-xs text-muted-foreground">
        Showing {receipts.length} receipt{receipts.length !== 1 ? 's' : ''} and {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
