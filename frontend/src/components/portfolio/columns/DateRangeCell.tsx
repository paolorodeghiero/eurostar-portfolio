import { memo } from 'react';
import { format } from 'date-fns';

interface DateRangeCellProps {
  startDate: string | null;
  endDate: string | null;
}

export const DateRangeCell = memo(function DateRangeCell({ startDate, endDate }: DateRangeCellProps) {
  const formatDate = (date: string | null) => {
    if (!date) return 'TBD';
    try {
      return format(new Date(date), 'MMM yyyy');
    } catch {
      return 'TBD';
    }
  };

  const start = formatDate(startDate);
  const end = formatDate(endDate);

  if (start === 'TBD' && end === 'TBD') {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span className="text-sm whitespace-nowrap">
      {start} - {end}
    </span>
  );
});
