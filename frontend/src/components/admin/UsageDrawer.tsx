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

interface TeamUsage {
  id: number;
  name: string;
  description?: string;
}

interface BudgetLineUsage {
  id: number;
  company: string;
  lineValue: string;
  lineAmount: number;
  currency: string;
  type: 'CAPEX' | 'OPEX';
  fiscalYear: number;
}

interface ProjectValueUsage {
  id: number;
  projectId: number;
  score: number;
}

type UsageResponse =
  | { projects: ProjectUsage[] }
  | { teams: TeamUsage[] }
  | { budgetLines: BudgetLineUsage[] }
  | { projectValues: ProjectValueUsage[] };

export function UsageDrawer({
  referentialType,
  referentialId,
  referentialName,
  open,
  onOpenChange,
}: UsageDrawerProps) {
  const [usage, setUsage] = useState<UsageResponse>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && referentialId) {
      setIsLoading(true);
      apiClient<UsageResponse>(
        `/api/admin/${referentialType}/${referentialId}/usage`
      )
        .then(setUsage)
        .catch((err) => {
          console.error('Failed to fetch usage:', err);
          setUsage(undefined);
        })
        .finally(() => setIsLoading(false));
    }
  }, [open, referentialType, referentialId]);

  // Determine what type of entities we're displaying
  const getUsageInfo = () => {
    if (!usage) return { entityType: '', items: [], count: 0 };

    if ('projects' in usage) {
      return { entityType: 'projects', items: usage.projects, count: usage.projects.length };
    }
    if ('teams' in usage) {
      return { entityType: 'teams', items: usage.teams, count: usage.teams.length };
    }
    if ('budgetLines' in usage) {
      return { entityType: 'budget lines', items: usage.budgetLines, count: usage.budgetLines.length };
    }
    if ('projectValues' in usage) {
      return { entityType: 'project values', items: usage.projectValues, count: usage.projectValues.length };
    }

    return { entityType: '', items: [], count: 0 };
  };

  const usageInfo = getUsageInfo();

  const renderItem = (item: any, entityType: string) => {
    if (entityType === 'projects') {
      return (
        <div key={item.id} className="p-3 border rounded-md hover:bg-muted/50 transition-colors">
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-muted-foreground">
            {item.projectId}
            {item.statusName && ` • ${item.statusName}`}
            {item.role && ` • ${item.role}`}
            {item.score !== undefined && ` • Score: ${item.score}`}
          </p>
        </div>
      );
    }

    if (entityType === 'teams') {
      return (
        <div key={item.id} className="p-3 border rounded-md hover:bg-muted/50 transition-colors">
          <p className="font-medium">{item.name}</p>
          {item.description && (
            <p className="text-sm text-muted-foreground">{item.description}</p>
          )}
        </div>
      );
    }

    if (entityType === 'budget lines') {
      return (
        <div key={item.id} className="p-3 border rounded-md hover:bg-muted/50 transition-colors">
          <p className="font-medium">{item.company} - {item.lineValue}</p>
          <p className="text-sm text-muted-foreground">
            {item.type} • {item.currency} {item.lineAmount.toLocaleString()} • FY {item.fiscalYear}
          </p>
        </div>
      );
    }

    if (entityType === 'project values') {
      return (
        <div key={item.id} className="p-3 border rounded-md hover:bg-muted/50 transition-colors">
          <p className="font-medium">Project ID: {item.projectId}</p>
          <p className="text-sm text-muted-foreground">Score: {item.score}</p>
        </div>
      );
    }

    return null;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Usage of "{referentialName}"</SheetTitle>
          <SheetDescription>
            {isLoading
              ? 'Loading...'
              : `${usageInfo.count} ${usageInfo.entityType} found`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-2">
          {usageInfo.count === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No {usageInfo.entityType || 'items'} currently using this item.
            </p>
          )}

          {usageInfo.items.map((item) => renderItem(item, usageInfo.entityType))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
