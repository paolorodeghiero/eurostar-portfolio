import { useEffect, useState, useCallback } from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { ProjectHeader } from './ProjectHeader';
import { ProjectFooter } from './ProjectFooter';
import { ProjectTabs } from './ProjectTabs';
import { ConflictDialog } from './ConflictDialog';
import { useAutoSave } from '@/hooks/useAutoSave';
import { fetchProject, updateProject, type Project, type ConflictError } from '@/lib/project-api';
import { updateProjectBudget } from '@/lib/project-budget-api';

interface ProjectSidebarProps {
  projectId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdated?: () => void;
  onDeleted?: () => void;
  defaultTab?: string;
}

export function ProjectSidebar({
  projectId,
  open,
  onOpenChange,
  onProjectUpdated,
  onDeleted,
  defaultTab
}: ProjectSidebarProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({});
  const [loading, setLoading] = useState(false);
  const [conflictState, setConflictState] = useState<{
    localData: Partial<Project>;
    serverData: Project;
  } | null>(null);

  // Load project when ID changes
  useEffect(() => {
    if (projectId && open) {
      // Clear previous project immediately to avoid showing stale data
      setProject(null);
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
            description: p.description,
            budgetCurrency: p.budgetCurrency,
            reportCurrency: p.reportCurrency,
            businessCaseFile: p.businessCaseFile,
          });
        })
        .finally(() => setLoading(false));
    }
  }, [projectId, open]);

  // Auto-save with conflict detection
  const handleSave = useCallback(async (data: Partial<Project>) => {
    if (!project) return;
    try {
      const updated = await updateProject(project.id, {
        ...data,
        expectedVersion: project.version,
      });
      setProject(updated);
      onProjectUpdated?.();
    } catch (error) {
      const conflictError = error as ConflictError;
      if (conflictError.statusCode === 409) {
        setConflictState({
          localData: data,
          serverData: conflictError.serverData,
        });
        throw error; // Re-throw so auto-save shows error state
      }
      throw error;
    }
  }, [project, onProjectUpdated]);

  // Conflict resolution handlers
  const handleKeepLocal = useCallback(async () => {
    if (!conflictState || !project) return;
    try {
      // Update with new version from server
      const updated = await updateProject(project.id, {
        ...conflictState.localData,
        expectedVersion: conflictState.serverData.version,
      });
      setProject(updated);
      setConflictState(null);
      onProjectUpdated?.();
    } catch (error) {
      console.error('Failed to save local version:', error);
    }
  }, [conflictState, project, onProjectUpdated]);

  const handleKeepServer = useCallback(() => {
    if (!conflictState) return;
    // Reset form data to server version
    setProject(conflictState.serverData);
    setFormData({
      name: conflictState.serverData.name,
      statusId: conflictState.serverData.statusId,
      startDate: conflictState.serverData.startDate,
      endDate: conflictState.serverData.endDate,
      leadTeamId: conflictState.serverData.leadTeamId,
      projectManager: conflictState.serverData.projectManager,
      isOwner: conflictState.serverData.isOwner,
      sponsor: conflictState.serverData.sponsor,
      description: conflictState.serverData.description,
      budgetCurrency: conflictState.serverData.budgetCurrency,
      reportCurrency: conflictState.serverData.reportCurrency,
      businessCaseFile: conflictState.serverData.businessCaseFile,
    });
    setConflictState(null);
  }, [conflictState]);

  // Read-only mode based on status.isReadOnly (Stopped/Completed statuses)
  const isReadOnly = project?.status?.isReadOnly ?? false;

  // Track currency update in progress to prevent double-clicks
  const [currencyUpdating, setCurrencyUpdating] = useState(false);

  // Handle report currency change - updates project and reloads
  const handleReportCurrencyChange = useCallback(async (currency: string) => {
    // Skip if same currency already selected or update in progress
    if (!projectId || currencyUpdating || currency === project?.reportCurrency) return;

    setCurrencyUpdating(true);
    try {
      await updateProjectBudget(projectId, { reportCurrency: currency });
      // Reload project to get updated reportCurrency
      const updated = await fetchProject(projectId);
      setProject(updated);
      onProjectUpdated?.();
    } catch (error) {
      console.error('Failed to update report currency:', error);
    } finally {
      setCurrencyUpdating(false);
    }
  }, [projectId, project?.reportCurrency, currencyUpdating, onProjectUpdated]);

  const { status, statusText, saveNow } = useAutoSave({
    data: formData,
    onSave: handleSave,
    enabled: !!project && !loading && !isReadOnly,
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
            "fixed z-50 gap-4 bg-background shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out",
            "inset-y-0 right-0 h-full border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
            "data-[state=closed]:duration-200 data-[state=open]:duration-300",
            "w-[50vw] min-w-[400px] max-w-[800px] p-0 flex flex-col"
          )}
        >
          <ProjectHeader
            project={project}
            name={formData.name ?? project?.name ?? ''}
            onNameChange={(name) => setFormData((prev) => ({ ...prev, name }))}
            onClose={handleClose}
            onProjectUpdated={() => {
              // Reload project data and notify parent
              if (projectId) {
                fetchProject(projectId).then(setProject);
              }
              onProjectUpdated?.();
            }}
            onDeleted={() => {
              onOpenChange(false);
              onDeleted?.();
            }}
            onReportCurrencyChange={handleReportCurrencyChange}
            currencyUpdating={currencyUpdating}
            disabled={isReadOnly}
          />

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                Loading...
              </div>
            ) : project ? (
              <ProjectTabs
                project={project}
                formData={formData}
                onChange={isReadOnly ? () => {} : setFormData}
                onProjectUpdated={onProjectUpdated}
                disabled={isReadOnly}
                defaultTab={defaultTab}
              />
            ) : null}
          </div>

          <ProjectFooter status={status} statusText={statusText} />

          {conflictState && (
            <ConflictDialog
              open={true}
              localData={conflictState.localData}
              serverData={conflictState.serverData}
              onKeepLocal={handleKeepLocal}
              onKeepServer={handleKeepServer}
              onCancel={() => setConflictState(null)}
            />
          )}
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}
