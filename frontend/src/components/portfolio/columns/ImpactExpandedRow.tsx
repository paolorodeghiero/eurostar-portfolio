import { Badge } from '@/components/ui/badge';
import { TSHIRT_COLORS } from '@/lib/effort-utils';

interface ImpactTeam {
  teamId: number;
  teamName: string;
  impactSize: string;
}

interface ImpactExpandedRowProps {
  impactTeams: ImpactTeam[];
}

export function ImpactExpandedRow({ impactTeams }: ImpactExpandedRowProps) {
  if (!impactTeams || impactTeams.length === 0) {
    return <p className="text-sm text-muted-foreground p-2">No change impact teams</p>;
  }

  return (
    <div className="p-4 bg-muted/30 border-t">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
        Change Impact by Team
      </h4>
      <div className="flex flex-wrap gap-2">
        {impactTeams.map((team) => (
          <div
            key={team.teamId}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border"
          >
            <span className="text-sm font-medium">{team.teamName}</span>
            <Badge className={`text-xs ${TSHIRT_COLORS[team.impactSize] || 'bg-gray-300'}`}>
              {team.impactSize}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
