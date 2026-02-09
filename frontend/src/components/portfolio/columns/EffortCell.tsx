import { TeamChip } from '@/components/projects/TeamChip';

interface Team {
  teamId: number;
  teamName: string;
  effortSize: string;
  isLead: boolean;
}

interface EffortCellProps {
  teams: Team[];
  leadTeamId: number | null;
}

export function EffortCell({ teams, leadTeamId }: EffortCellProps) {
  if (!teams || teams.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  // Show max 3 teams, then "+N more"
  const displayTeams = teams.slice(0, 3);
  const remainingCount = teams.length - 3;

  return (
    <div className="flex gap-1 flex-wrap items-center">
      {displayTeams.map((team) => (
        <TeamChip
          key={team.teamId}
          teamName={team.teamName}
          size={team.effortSize}
          isLead={team.teamId === leadTeamId}
        />
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-muted-foreground">+{remainingCount}</span>
      )}
    </div>
  );
}
