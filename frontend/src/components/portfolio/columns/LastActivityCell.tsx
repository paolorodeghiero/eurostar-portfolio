import { memo } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface LastActivityCellProps {
  updatedAt: string | null;
}

export const LastActivityCell = memo(function LastActivityCell({ updatedAt }: LastActivityCellProps) {
  if (!updatedAt) {
    return <span className="text-muted-foreground">—</span>;
  }

  const relativeTime = formatDistanceToNow(new Date(updatedAt), { addSuffix: true });

  return (
    <span
      className="text-sm text-muted-foreground"
      title={new Date(updatedAt).toLocaleString()}
    >
      {relativeTime}
    </span>
  );
});
