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
  fetchProjectChangeImpact,
  addProjectChangeImpact,
  updateProjectChangeImpact,
  removeProjectChangeImpact,
  type ProjectChangeImpact,
} from '@/lib/project-api';
import { apiClient } from '@/lib/api-client';
import { deriveGlobalImpact, TSHIRT_COLORS } from '@/lib/effort-utils';

interface Team {
  id: number;
  name: string;
}

interface ChangeImpactTabProps {
  projectId: number;
  onProjectUpdated?: () => void;
  disabled?: boolean;
}

export function ChangeImpactTab({ projectId, onProjectUpdated, disabled }: ChangeImpactTabProps) {
  const [impactTeams, setImpactTeams] = useState<ProjectChangeImpact[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ci, at] = await Promise.all([
        fetchProjectChangeImpact(projectId),
        apiClient<Team[]>('/api/admin/teams'),
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
    onProjectUpdated?.();
  };

  const handleRemove = async (teamId: number) => {
    await removeProjectChangeImpact(projectId, teamId);
    setImpactTeams(prev => prev.filter(t => t.teamId !== teamId));
    onProjectUpdated?.();
  };

  const handleAdd = async (teamId: number) => {
    await addProjectChangeImpact(projectId, teamId, 'M');
    setAddOpen(false);
    loadData();
    onProjectUpdated?.();
  };

  const assignedIds = new Set(impactTeams.map(t => t.teamId));
  const availableTeams = allTeams.filter(t => !assignedIds.has(t.id));

  if (loading) {
    return <div className="text-muted-foreground">Loading change impact...</div>;
  }

  const globalImpact = deriveGlobalImpact(impactTeams.map(t => ({ impactSize: t.impactSize })));

  return (
    <div className="space-y-6">
      {/* Global Impact Summary */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Change Impact
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Aggregate impact based on {impactTeams.length} team{impactTeams.length !== 1 ? 's' : ''}
          </p>
        </div>
        {globalImpact ? (
          <Badge className={`text-lg px-4 py-1 ${TSHIRT_COLORS[globalImpact] || 'bg-gray-300'}`}>
            {globalImpact}
          </Badge>
        ) : (
          <span className="text-muted-foreground">No teams assigned</span>
        )}
      </div>

      {/* Divider */}
      <div className="border-t" />

      {/* Impacted Teams Section */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Impacted Teams</h3>
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
        {impactTeams.length === 0 ? (
          <p className="text-sm text-muted-foreground">No teams assigned yet.</p>
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

      <p className="text-sm text-muted-foreground mt-2">
        Teams affected by this project's changes (who needs to adapt, not who builds).
      </p>

      <div className="mt-4 text-xs text-muted-foreground">
        <strong>T-shirt sizes:</strong> XS (&lt;50md), S (50-150md), M (150-250md), L (250-500md), XL (500-1000md), XXL (&gt;1000md)
      </div>
    </div>
  );
}
