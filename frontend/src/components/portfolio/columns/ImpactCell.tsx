import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { deriveGlobalImpact, TSHIRT_COLORS } from '@/lib/effort-utils';

interface ImpactTeam {
  teamId: number;
  teamName: string;
  impactSize: string;
}

interface ImpactCellProps {
  impactTeams: ImpactTeam[];
  onClick?: () => void;
}

export const ImpactCell = memo(function ImpactCell({
  impactTeams,
  onClick,
}: ImpactCellProps) {
  const globalImpact = deriveGlobalImpact(impactTeams);

  if (!globalImpact) {
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
      <Badge className={TSHIRT_COLORS[globalImpact] || 'bg-gray-300'}>
        {globalImpact}
      </Badge>
      <span className="text-xs text-muted-foreground">
        ({impactTeams.length})
      </span>
    </div>
  );
});
