import { memo } from 'react';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { deriveGlobalImpact, TSHIRT_COLORS } from '@/lib/effort-utils';
import { cn } from '@/lib/utils';

interface ImpactTeam {
  teamId: number;
  teamName: string;
  impactSize: string;
}

interface ImpactCellProps {
  impactTeams: ImpactTeam[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const ImpactCell = memo(function ImpactCell({
  impactTeams,
  isExpanded = false,
  onToggleExpand,
}: ImpactCellProps) {
  const globalImpact = deriveGlobalImpact(impactTeams);

  if (!globalImpact) {
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
      <Badge className={TSHIRT_COLORS[globalImpact] || 'bg-gray-300'}>
        {globalImpact}
      </Badge>
      <span className="text-xs text-muted-foreground">
        ({impactTeams.length})
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
