import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { deriveGlobalEffort, TSHIRT_COLORS } from '@/lib/effort-utils';

interface Team {
  teamId: number;
  teamName: string;
  effortSize: string;
  isLead: boolean;
}

interface EffortCellProps {
  teams: Team[];
  onClick?: () => void;
}

export const EffortCell = memo(function EffortCell({
  teams,
  onClick,
}: EffortCellProps) {
  const globalEffort = deriveGlobalEffort(teams);

  if (!globalEffort) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div
      className="flex items-center gap-2 cursor-pointer hover:opacity-80"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
          onClick?.();
        }
      }}
    >
      <Badge className={TSHIRT_COLORS[globalEffort] || 'bg-gray-300'}>
        {globalEffort}
      </Badge>
      <span className="text-xs text-muted-foreground">
        ({teams.length})
      </span>
    </div>
  );
});
