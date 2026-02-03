import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Project } from '@/lib/project-api';

interface GeneralTabProps {
  project: Project;
  formData: Partial<Project>;
  onChange: (updates: Partial<Project>) => void;
  disabled?: boolean;
}

interface Status {
  id: number;
  name: string;
  color: string;
}

interface Team {
  id: number;
  name: string;
}

export function GeneralTab({ formData, onChange, disabled }: GeneralTabProps) {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  // Load statuses and teams for dropdowns
  useEffect(() => {
    fetch('/api/admin/statuses').then(r => r.json()).then(setStatuses);
    fetch('/api/admin/teams').then(r => r.json()).then(setTeams);
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          value={formData.name || ''}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          placeholder="Enter project name"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.statusId?.toString() || ''}
          onValueChange={(v: string) => onChange({ ...formData, statusId: parseInt(v) })}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s.id} value={s.id.toString()}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate || ''}
            onChange={(e) => onChange({ ...formData, startDate: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate || ''}
            onChange={(e) => onChange({ ...formData, endDate: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="leadTeam">Lead Team</Label>
        <Select
          value={formData.leadTeamId?.toString() || ''}
          onValueChange={(v: string) => onChange({ ...formData, leadTeamId: parseInt(v) })}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select lead team" />
          </SelectTrigger>
          <SelectContent>
            {teams.map((t) => (
              <SelectItem key={t.id} value={t.id.toString()}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
