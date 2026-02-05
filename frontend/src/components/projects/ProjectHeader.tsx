import { useState, useRef, useEffect } from 'react';
import { X, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjectMenu } from './ProjectMenu';
import { cn } from '@/lib/utils';
import type { Project } from '@/lib/project-api';

interface ProjectHeaderProps {
  project: Project | null;
  name: string;
  onNameChange: (name: string) => void;
  onClose: () => void;
  onProjectUpdated?: () => void;
  onDeleted?: () => void;
  onReportCurrencyChange?: (currency: string) => void;
  currencyUpdating?: boolean;
  disabled?: boolean;
}

export function ProjectHeader({
  project,
  name,
  onNameChange,
  onClose,
  onProjectUpdated,
  onDeleted,
  onReportCurrencyChange,
  currencyUpdating,
  disabled
}: ProjectHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update edit value when name changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(name);
    }
  }, [name, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (!project) return null;

  const isDisabled = project.isStopped || currencyUpdating || disabled;
  const currentCurrency = project.reportCurrency;

  const handleStartEdit = () => {
    if (isDisabled) return;
    setEditValue(name);
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== name) {
      onNameChange(trimmed);
    } else {
      setEditValue(name); // Reset to original if empty
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-white border-b px-4 py-3">
      {/* Line 1: ID left, Menu and Close right */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-sm text-muted-foreground">
          {project.projectId}
        </span>
        <div className="flex items-center gap-1">
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

      {/* Line 2: Title left, Status and Currency right */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 group min-w-0 flex-1">
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="text-lg font-semibold h-auto py-1"
            />
          ) : (
            <>
              <h2 className="text-lg font-semibold truncate">{name}</h2>
              {!isDisabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={handleStartEdit}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
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
          {onReportCurrencyChange && currentCurrency && (
            <div className="inline-flex rounded-md border border-input bg-background">
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
      </div>
    </div>
  );
}
