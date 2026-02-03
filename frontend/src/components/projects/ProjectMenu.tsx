import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoreVertical, Square, RotateCcw, Trash2 } from 'lucide-react';
import { stopProject, reactivateProject, deleteProject, type Project } from '@/lib/project-api';

interface ProjectMenuProps {
  project: Project;
  onProjectUpdated: () => void;
  onDeleted: () => void;
}

export function ProjectMenu({ project, onProjectUpdated, onDeleted }: ProjectMenuProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Placeholder - actuals count would come from API
  const hasActuals = false; // TODO: Get from project when actuals exist

  const handleStop = async () => {
    await stopProject(project.id);
    onProjectUpdated();
  };

  const handleReactivate = async () => {
    await reactivateProject(project.id);
    onProjectUpdated();
  };

  const handleDelete = async () => {
    if (confirmName !== project.name) return;
    setDeleting(true);
    try {
      await deleteProject(project.id);
      setDeleteOpen(false);
      onDeleted();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <TooltipProvider>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!project.isStopped && (
            <DropdownMenuItem onClick={handleStop}>
              <Square className="h-4 w-4 mr-2" />
              Stop Project
            </DropdownMenuItem>
          )}

          {project.isStopped && (
            <DropdownMenuItem onClick={handleReactivate}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reactivate
            </DropdownMenuItem>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="w-full">
                <DropdownMenuItem
                  onClick={() => !hasActuals && setDeleteOpen(true)}
                  disabled={hasActuals}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </span>
            </TooltipTrigger>
            {hasActuals && (
              <TooltipContent side="left">
                Cannot delete: project has actuals recorded
              </TooltipContent>
            )}
          </Tooltip>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Type the project name to confirm:
              <br />
              <strong className="text-foreground">{project.name}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder="Type project name to confirm"
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmName('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={confirmName !== project.name || deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
