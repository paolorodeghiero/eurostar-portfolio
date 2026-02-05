import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProjectMenu } from './ProjectMenu';
import { cn } from '@/lib/utils';
import type { Project } from '@/lib/project-api';

interface ProjectHeaderProps {
  project: Project | null;
  onClose: () => void;
  onProjectUpdated?: () => void;
  onDeleted?: () => void;
  onReportCurrencyChange?: (currency: string) => void;
  currencyUpdating?: boolean;
}

export function ProjectHeader({ project, onClose, onProjectUpdated, onDeleted, onReportCurrencyChange, currencyUpdating }: ProjectHeaderProps) {
  if (!project) return null;

  const isDisabled = project.isStopped || currencyUpdating;
  // Use actual reportCurrency - no default, toggle shows what's stored
  const currentCurrency = project.reportCurrency;

  return (
    <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-muted-foreground">
          {project.projectId}
        </span>
        <h2 className="font-semibold truncate max-w-[200px]">{project.name}</h2>
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
        {/* Report Currency Toggle - only show when reportCurrency is set */}
        {onReportCurrencyChange && currentCurrency && (
          <div className="inline-flex rounded-md border border-input bg-background ml-2">
            <button
              type="button"
              onClick={() => onReportCurrencyChange('EUR')}
              disabled={isDisabled}
              className={cn(
                'px-2 py-0.5 text-xs font-medium transition-colors rounded-l-md',
                currentCurrency === 'EUR'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              EUR
            </button>
            <button
              type="button"
              onClick={() => onReportCurrencyChange('GBP')}
              disabled={isDisabled}
              className={cn(
                'px-2 py-0.5 text-xs font-medium transition-colors rounded-r-md border-l',
                currentCurrency === 'GBP'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              GBP
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onProjectUpdated && onDeleted && (
          <ProjectMenu
            project={project}
            onProjectUpdated={onProjectUpdated}
            onDeleted={onDeleted}
          />
        )}
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
