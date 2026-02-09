import { Badge } from '@/components/ui/badge';
import { TSHIRT_COLORS } from '@/lib/effort-utils';
import { cn } from '@/lib/utils';

interface Team {
  teamId: number;
  teamName: string;
  effortSize: string;
  isLead: boolean;
}

interface EffortExpandedRowProps {
  teams: Team[];
}

export function EffortExpandedRow({ teams }: EffortExpandedRowProps) {
  if (!teams || teams.length === 0) {
    return <p className="text-sm text-muted-foreground p-2">No teams assigned</p>;
  }

  return (
    <div className="p-4 bg-muted/30 border-t">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
        Team Effort Breakdown
      </h4>
      <div className="flex flex-wrap gap-2">
        {teams.map((team) => (
          <div
            key={team.teamId}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md border",
              team.isLead ? "border-primary bg-primary/5" : "border-border"
            )}
          >
            <span className="text-sm font-medium">{team.teamName}</span>
            {team.isLead && (
              <span className="text-xs text-primary font-medium">Lead</span>
            )}
            <Badge className={`text-xs ${TSHIRT_COLORS[team.effortSize] || 'bg-gray-300'}`}>
              {team.effortSize}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
