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
import { Plus } from 'lucide-react';
import {
  fetchProjectChangeImpact,
  addProjectChangeImpact,
  updateProjectChangeImpact,
  removeProjectChangeImpact,
  type ProjectChangeImpact,
} from '@/lib/project-api';

interface Team {
  id: number;
  name: string;
}

interface ChangeImpactTabProps {
  projectId: number;
  disabled?: boolean;
}

export function ChangeImpactTab({ projectId, disabled }: ChangeImpactTabProps) {
  const [impactTeams, setImpactTeams] = useState<ProjectChangeImpact[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ci, at] = await Promise.all([
        fetchProjectChangeImpact(projectId),
        fetch('/api/admin/teams').then(r => r.json()),
      ]);
      setImpactTeams(ci);
      setAllTeams(at);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleSizeChange = async (teamId: number, size: string) => {
    await updateProjectChangeImpact(projectId, teamId, size);
    setImpactTeams(prev =>
      prev.map(t => t.teamId === teamId ? { ...t, impactSize: size } : t)
    );
  };

  const handleRemove = async (teamId: number) => {
    await removeProjectChangeImpact(projectId, teamId);
    setImpactTeams(prev => prev.filter(t => t.teamId !== teamId));
  };

  const handleAdd = async (teamId: number) => {
    await addProjectChangeImpact(projectId, teamId, 'M');
    setAddOpen(false);
    loadData();
  };

  const assignedIds = new Set(impactTeams.map(t => t.teamId));
  const availableTeams = allTeams.filter(t => !assignedIds.has(t.id));

  if (loading) {
    return <div className="text-muted-foreground">Loading change impact...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Change Impact Teams</h3>
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

      <p className="text-sm text-muted-foreground">
        Teams affected by this project's changes (who needs to adapt, not who builds).
      </p>

      <div className="flex flex-wrap gap-2">
        {impactTeams.length === 0 ? (
          <p className="text-sm text-muted-foreground">No change impact teams defined.</p>
        ) : (
          impactTeams.map((team) => (
            <TeamChip
              key={team.teamId}
              teamName={team.teamName}
              size={team.impactSize}
              onSizeChange={disabled ? undefined : (size) => handleSizeChange(team.teamId, size)}
              onRemove={disabled ? undefined : () => handleRemove(team.teamId)}
            />
          ))
        )}
      </div>
    </div>
  );
}
