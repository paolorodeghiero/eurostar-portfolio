import { useEffect, useState, useCallback } from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { ProjectHeader } from './ProjectHeader';
import { ProjectFooter } from './ProjectFooter';
import { ProjectTabs } from './ProjectTabs';
import { useAutoSave } from '@/hooks/useAutoSave';
import { fetchProject, updateProject, type Project } from '@/lib/project-api';

interface ProjectSidebarProps {
  projectId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdated?: () => void;
}

export function ProjectSidebar({
  projectId,
  open,
  onOpenChange,
  onProjectUpdated
}: ProjectSidebarProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({});
  const [loading, setLoading] = useState(false);

  // Load project when ID changes
  useEffect(() => {
    if (projectId && open) {
      setLoading(true);
      fetchProject(projectId)
        .then((p) => {
          setProject(p);
          setFormData({
            name: p.name,
            statusId: p.statusId,
            startDate: p.startDate,
            endDate: p.endDate,
            leadTeamId: p.leadTeamId,
            projectManager: p.projectManager,
            isOwner: p.isOwner,
            sponsor: p.sponsor,
          });
        })
        .finally(() => setLoading(false));
    }
  }, [projectId, open]);

  // Auto-save
  const handleSave = useCallback(async (data: Partial<Project>) => {
    if (!project) return;
    const updated = await updateProject(project.id, {
      ...data,
      expectedVersion: project.version,
    });
    setProject(updated);
    onProjectUpdated?.();
  }, [project, onProjectUpdated]);

  const { status, statusText, saveNow } = useAutoSave({
    data: formData,
    onSave: handleSave,
    enabled: !!project && !loading,
  });

  // Handle close - save first
  const handleClose = useCallback(() => {
    saveNow();
    onOpenChange(false);
  }, [saveNow, onOpenChange]);

  // Escape key - handled via onOpenChange
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      handleClose();
    } else {
      onOpenChange(newOpen);
    }
  }, [handleClose, onOpenChange]);

  return (
    <SheetPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <SheetPrimitive.Content
          className={cn(
            "fixed z-50 gap-4 bg-background shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",
            "inset-y-0 right-0 h-full border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
            "w-[500px] sm:w-[540px] p-0 flex flex-col"
          )}
        >
          <ProjectHeader project={project} onClose={handleClose} />

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                Loading...
              </div>
            ) : project ? (
              <ProjectTabs
                project={project}
                formData={formData}
                onChange={setFormData}
              />
            ) : null}
          </div>

          <ProjectFooter status={status} statusText={statusText} />
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}
