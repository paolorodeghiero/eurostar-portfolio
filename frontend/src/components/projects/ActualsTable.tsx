import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Trash2, Download } from 'lucide-react';
import { Receipt, exportReceiptsExcel } from '@/lib/actuals-api';

interface ActualsTableProps {
  receipts: Receipt[];
  projectId: string;
  onDelete: (id: number) => void;
  onDeleteAll: () => void;
  disabled?: boolean;
}

export function ActualsTable({
  receipts,
  projectId,
  onDelete,
  onDeleteAll,
  disabled = false,
}: ActualsTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: receipts.length,
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
    exportReceiptsExcel(receipts, projectId);
  };

  if (receipts.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No receipts recorded
      </div>
    );
  }

  return (
    <div>
      {/* Table Header */}
      <div className="grid grid-cols-[100px_80px_80px_100px_1fr_120px_50px] gap-2 px-3 py-2 bg-gray-50 border-b text-xs font-medium text-muted-foreground">
        <div>ID</div>
        <div>Company</div>
        <div>PO</div>
        <div>Date</div>
        <div>Description</div>
        <div className="text-right">Amount</div>
        <div className="text-right"></div>
      </div>

      {/* Virtualized List */}
      <div
        ref={parentRef}
        className="overflow-auto border-b"
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
            const receipt = receipts[virtualItem.index];

            return (
              <div
                key={virtualItem.key}
                className="grid grid-cols-[100px_80px_80px_100px_1fr_120px_50px] gap-2 px-3 py-2 border-b text-sm hover:bg-gray-50"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {/* ID */}
                <div className="text-xs text-muted-foreground truncate">
                  {receipt.receiptNumber}
                </div>

                {/* Company */}
                <div className="text-xs text-muted-foreground truncate">
                  {receipt.company}
                </div>

                {/* Purchase Order */}
                <div className="text-xs text-muted-foreground truncate">
                  {receipt.purchaseOrder}
                </div>

                {/* Date */}
                <div className="text-xs text-muted-foreground">
                  {formatDate(receipt.receiptDate)}
                </div>

                {/* Description */}
                <div className="text-xs truncate">
                  {receipt.description || 'No description'}
                </div>

                {/* Amount */}
                <div className="text-right text-xs font-medium">
                  {formatCurrency(receipt.amount, receipt.currency)}
                </div>

                {/* Delete */}
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(receipt.id)}
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

      {/* Action Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="text-xs"
        >
          <Download className="h-3 w-3 mr-1" />
          Download Excel
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDeleteAll}
          disabled={disabled || receipts.length === 0}
          className="text-xs"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete All Receipts
        </Button>
      </div>
    </div>
  );
}
