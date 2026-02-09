import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, Download, FileText, Trash2 } from 'lucide-react';
import { DescriptionEditor } from '../DescriptionEditor';
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

// Section divider component
function SectionDivider() {
  return <div className="border-t my-6" />;
}

// Section header component
function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
      {title}
    </h3>
  );
}

export function GeneralTab({ project, formData, onChange, disabled }: GeneralTabProps) {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [uploading, setUploading] = useState(false);

  // Load statuses and teams for dropdowns
  useEffect(() => {
    fetch('/api/admin/statuses')
      .then(r => r.json())
      .then(data => setStatuses(Array.isArray(data) ? data : []))
      .catch(() => setStatuses([]));
    fetch('/api/admin/teams')
      .then(r => r.json())
      .then(data => setTeams(Array.isArray(data) ? data : []))
      .catch(() => setTeams([]));
  }, []);

  // Get current names for display
  const currentTeamName = teams.find(t => t.id === formData.leadTeamId)?.name || project.leadTeam?.name;
  const currentStatusName = statuses.find(s => s.id === formData.statusId)?.name || project.status?.name;
  const currentStatusColor = statuses.find(s => s.id === formData.statusId)?.color || project.status?.color;

  // Business case file handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formDataObj = new FormData();
    formDataObj.append('file', file);

    try {
      const res = await fetch(`/api/projects/${project.id}/business-case`, {
        method: 'POST',
        body: formDataObj,
      });
      if (res.ok) {
        const data = await res.json();
        onChange({ ...formData, businessCaseFile: data.filename });
      }
    } catch (err) {
      console.error('Failed to upload business case:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async () => {
    try {
      await fetch(`/api/projects/${project.id}/business-case`, { method: 'DELETE' });
      onChange({ ...formData, businessCaseFile: null });
    } catch (err) {
      console.error('Failed to delete business case:', err);
    }
  };

  const businessCaseFile = formData.businessCaseFile ?? project.businessCaseFile;

  return (
    <div className="space-y-2">
      {/* ===== CORE INFO SECTION ===== */}
      <SectionHeader title="Core Information" />
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.statusId?.toString() || ''}
            onValueChange={(v: string) => onChange({ ...formData, statusId: parseInt(v) })}
            disabled={disabled}
          >
            <SelectTrigger>
              {currentStatusName ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentStatusColor }}
                  />
                  {currentStatusName}
                </div>
              ) : (
                <SelectValue placeholder="Select status" />
              )}
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
              {currentTeamName ? (
                <span>{currentTeamName}</span>
              ) : (
                <SelectValue placeholder="Select lead team" />
              )}
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

      <SectionDivider />

      {/* ===== DESCRIPTION SECTION ===== */}
      <SectionHeader title="Description" />
      <DescriptionEditor
        value={formData.description || project.description || ''}
        onChange={(html) => onChange({ ...formData, description: html })}
        disabled={disabled}
        placeholder="Describe the project objectives, scope, and key deliverables..."
      />

      <SectionDivider />

      {/* ===== BUSINESS CASE SECTION ===== */}
      <SectionHeader title="Business Case" />
      <div className="space-y-3">
        {businessCaseFile ? (
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">{businessCaseFile}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  window.open(`/api/projects/${project.id}/business-case/download`, '_blank');
                }}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFileDelete}
                disabled={disabled}
                title="Delete"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Upload business case document (PDF, Word, PowerPoint)
            </p>
            <label>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={handleFileUpload}
                disabled={disabled || uploading}
              />
              <Button variant="outline" size="sm" disabled={disabled || uploading} asChild>
                <span>{uploading ? 'Uploading...' : 'Choose File'}</span>
              </Button>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
