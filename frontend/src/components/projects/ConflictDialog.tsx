import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { Project } from '@/lib/project-api';

interface ConflictDialogProps {
  open: boolean;
  localData: Partial<Project>;
  serverData: Project;
  onKeepLocal: () => void;
  onKeepServer: () => void;
  onCancel: () => void;
}

function formatDate(date: string | null) {
  if (!date) return 'Unknown';
  return new Date(date).toLocaleString();
}

const fieldLabels: Record<string, string> = {
  name: 'Name',
  statusId: 'Status',
  startDate: 'Start Date',
  endDate: 'End Date',
  leadTeamId: 'Lead Team',
  projectManager: 'Project Manager',
  isOwner: 'IS Owner',
  sponsor: 'Sponsor',
};

export function ConflictDialog({
  open,
  localData,
  serverData,
  onKeepLocal,
  onKeepServer,
  onCancel,
}: ConflictDialogProps) {
  // Find fields that differ
  const differences: { field: string; label: string; local: unknown; server: unknown }[] = [];
  const fieldsToCompare: (keyof Project)[] = [
    'name',
    'statusId',
    'startDate',
    'endDate',
    'leadTeamId',
    'projectManager',
    'isOwner',
    'sponsor',
  ];

  fieldsToCompare.forEach((field) => {
    const localVal = localData[field];
    const serverVal = serverData[field];
    if (localVal !== serverVal) {
      differences.push({
        field,
        label: fieldLabels[field] || field,
        local: localVal ?? '(empty)',
        server: serverVal ?? '(empty)',
      });
    }
  });

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Save Conflict</AlertDialogTitle>
          <AlertDialogDescription>
            This project was modified while you were editing. Choose which version to keep.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid grid-cols-2 gap-4 my-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Your Version</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Your unsaved changes
            </p>
            {differences.length === 0 ? (
              <p className="text-sm text-muted-foreground">No differences</p>
            ) : (
              <div className="space-y-2">
                {differences.map((d) => (
                  <div key={d.field} className="text-sm">
                    <span className="font-medium">{d.label}:</span>{' '}
                    <span className="text-muted-foreground">{String(d.local)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Server Version</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Modified at {formatDate(serverData.updatedAt)}
            </p>
            {differences.length === 0 ? (
              <p className="text-sm text-muted-foreground">No differences</p>
            ) : (
              <div className="space-y-2">
                {differences.map((d) => (
                  <div key={d.field} className="text-sm">
                    <span className="font-medium">{d.label}:</span>{' '}
                    <span className="text-muted-foreground">{String(d.server)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="outline" onClick={onKeepServer}>
            Keep Server Version
          </Button>
          <Button onClick={onKeepLocal}>
            Keep My Version
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
