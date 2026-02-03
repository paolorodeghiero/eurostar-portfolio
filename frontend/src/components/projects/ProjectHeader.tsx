import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Project } from '@/lib/project-api';

interface ProjectHeaderProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectHeader({ project, onClose }: ProjectHeaderProps) {
  if (!project) return null;

  return (
    <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-muted-foreground">
          {project.projectId}
        </span>
        <h2 className="font-semibold truncate max-w-[250px]">{project.name}</h2>
        {project.status && (
          <Badge
            className="text-white"
            style={{ backgroundColor: project.status.color }}
          >
            {project.status.name}
          </Badge>
        )}
        {project.isStopped && (
          <Badge variant="secondary">Stopped</Badge>
        )}
      </div>
      <Button variant="ghost" size="icon" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
