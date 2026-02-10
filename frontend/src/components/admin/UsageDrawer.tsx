import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface UsageDrawerProps {
  referentialType: string; // 'departments', 'teams', 'statuses', etc.
  referentialId: number;
  referentialName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProjectUsage {
  id: number;
  projectId: string;
  name: string;
  statusName?: string;
  role?: 'lead' | 'involved';
  score?: number;
}

export function UsageDrawer({
  referentialType,
  referentialId,
  referentialName,
  open,
  onOpenChange,
}: UsageDrawerProps) {
  const [usage, setUsage] = useState<{ projects: ProjectUsage[] }>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && referentialId) {
      setIsLoading(true);
      apiClient<{ projects: ProjectUsage[] }>(
        `/api/admin/${referentialType}/${referentialId}/usage`
      )
        .then(setUsage)
        .catch((err) => {
          console.error('Failed to fetch usage:', err);
          setUsage({ projects: [] });
        })
        .finally(() => setIsLoading(false));
    }
  }, [open, referentialType, referentialId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Projects using "{referentialName}"</SheetTitle>
          <SheetDescription>
            {isLoading
              ? 'Loading...'
              : `${usage?.projects.length || 0} project(s) found`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-2">
          {usage?.projects.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No projects currently using this item.
            </p>
          )}

          {usage?.projects.map((project) => (
            <div
              key={project.id}
              className="p-3 border rounded-md hover:bg-muted/50 transition-colors"
            >
              <p className="font-medium">{project.name}</p>
              <p className="text-sm text-muted-foreground">
                {project.projectId}
                {project.statusName && ` • ${project.statusName}`}
                {project.role && ` • ${project.role}`}
                {project.score !== undefined && ` • Score: ${project.score}`}
              </p>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
