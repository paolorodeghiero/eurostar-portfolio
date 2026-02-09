import { useEffect, useState } from 'react';
import { TeamChip } from '../TeamChip';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import {
  fetchProjectTeams,
  addProjectTeam,
  updateProjectTeamSize,
  removeProjectTeam,
  type ProjectTeam,
} from '@/lib/project-api';
import { apiClient } from '@/lib/api-client';
import { deriveGlobalEffort, TSHIRT_COLORS } from '@/lib/effort-utils';

interface Team {
  id: number;
  name: string;
}

interface TeamsTabProps {
  projectId: number;
  disabled?: boolean;
}

export function TeamsTab({ projectId, disabled }: TeamsTabProps) {
  const [projectTeams, setProjectTeams] = useState<ProjectTeam[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const [pt, at] = await Promise.all([
        fetchProjectTeams(projectId),
        apiClient<Team[]>('/api/admin/teams'),
      ]);
      setProjectTeams(pt);
      setAllTeams(at);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, [projectId]);

  const handleSizeChange = async (teamId: number, size: string) => {
    await updateProjectTeamSize(projectId, teamId, size);
    setProjectTeams(prev =>
      prev.map(t => t.teamId === teamId ? { ...t, effortSize: size } : t)
    );
  };

  const handleRemove = async (teamId: number) => {
    await removeProjectTeam(projectId, teamId);
    setProjectTeams(prev => prev.filter(t => t.teamId !== teamId));
  };

  const handleAdd = async (teamId: number) => {
    await addProjectTeam(projectId, teamId, 'M'); // Default to M
    setAddOpen(false);
    loadTeams(); // Refresh to get team name
  };

  // Teams not yet assigned
  const assignedIds = new Set(projectTeams.map(t => t.teamId));
  const availableTeams = allTeams.filter(t => !assignedIds.has(t.id));

  if (loading) {
    return <div className="text-muted-foreground">Loading teams...</div>;
  }

  // Sort: lead first, then alphabetical
  const sortedTeams = [...projectTeams].sort((a, b) => {
    if (a.isLead && !b.isLead) return -1;
    if (!a.isLead && b.isLead) return 1;
    return a.teamName.localeCompare(b.teamName);
  });

  const globalEffort = deriveGlobalEffort(projectTeams.map(t => ({ effortSize: t.effortSize })));

  return (
    <div className="space-y-6">
      {/* Global Effort Summary */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Project Effort
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Aggregate effort based on {projectTeams.length} team{projectTeams.length !== 1 ? 's' : ''}
          </p>
        </div>
        {globalEffort ? (
          <Badge className={`text-lg px-4 py-1 ${TSHIRT_COLORS[globalEffort] || 'bg-gray-300'}`}>
            {globalEffort}
          </Badge>
        ) : (
          <span className="text-muted-foreground">No teams assigned</span>
        )}
      </div>

      {/* Divider */}
      <div className="border-t" />

      {/* Involved Teams Section */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Involved Teams</h3>
        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" disabled={disabled}>
              <Plus className="h-4 w-4 mr-1" />
              Add Team
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0" align="end">
            <Command>
              <CommandInput placeholder="Search teams..." />
              <CommandList>
                <CommandEmpty>No teams available</CommandEmpty>
                <CommandGroup>
                  {availableTeams.map((team) => (
                    <CommandItem
                      key={team.id}
                      onSelect={() => handleAdd(team.id)}
                    >
                      {team.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-wrap gap-2">
        {sortedTeams.length === 0 ? (
          <p className="text-sm text-muted-foreground">No teams assigned yet.</p>
        ) : (
          sortedTeams.map((team) => (
            <TeamChip
              key={team.teamId}
              teamName={team.teamName}
              size={team.effortSize}
              isLead={team.isLead}
              onSizeChange={disabled ? undefined : (size) => handleSizeChange(team.teamId, size)}
              onRemove={disabled || team.isLead ? undefined : () => handleRemove(team.teamId)}
            />
          ))
        )}
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        <strong>T-shirt sizes:</strong> XS (&lt;50md), S (50-150md), M (150-250md), L (250-500md), XL (500-1000md), XXL (&gt;1000md)
      </div>
    </div>
  );
}
