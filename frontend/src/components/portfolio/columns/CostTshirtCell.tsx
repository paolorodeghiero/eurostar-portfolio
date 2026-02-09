import { memo } from 'react';
import { Badge } from '@/components/ui/badge';

const TSHIRT_COLORS: Record<string, string> = {
  XS: 'bg-gray-300 text-gray-800',
  S: 'bg-blue-300 text-blue-800',
  M: 'bg-green-300 text-green-800',
  L: 'bg-yellow-300 text-yellow-800',
  XL: 'bg-orange-300 text-orange-800',
  XXL: 'bg-red-300 text-red-800',
};

interface CostTshirtCellProps {
  size: string | null;
}

export const CostTshirtCell = memo(function CostTshirtCell({ size }: CostTshirtCellProps) {
  if (!size) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <Badge className={TSHIRT_COLORS[size] || 'bg-gray-300 text-gray-800'}>
      {size}
    </Badge>
  );
});
