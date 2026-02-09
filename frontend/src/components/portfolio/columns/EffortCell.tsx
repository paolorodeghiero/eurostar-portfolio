import { memo } from 'react';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { deriveGlobalEffort, TSHIRT_COLORS } from '@/lib/effort-utils';
import { cn } from '@/lib/utils';

interface Team {
  teamId: number;
  teamName: string;
  effortSize: string;
  isLead: boolean;
}

interface EffortCellProps {
  teams: Team[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const EffortCell = memo(function EffortCell({
  teams,
  isExpanded = false,
  onToggleExpand,
}: EffortCellProps) {
  const globalEffort = deriveGlobalEffort(teams);

  if (!globalEffort) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div
      className="flex items-center gap-2 cursor-pointer hover:opacity-80"
      onClick={(e) => {
        e.stopPropagation(); // Prevent row click
        onToggleExpand?.();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
          onToggleExpand?.();
        }
      }}
    >
      <Badge className={TSHIRT_COLORS[globalEffort] || 'bg-gray-300'}>
        {globalEffort}
      </Badge>
      <span className="text-xs text-muted-foreground">
        ({teams.length})
      </span>
      <ChevronRight
        className={cn(
          "h-4 w-4 transition-transform duration-200",
          isExpanded && "rotate-90"
        )}
      />
    </div>
  );
});
