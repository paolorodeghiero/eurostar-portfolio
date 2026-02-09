import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { PortfolioProject } from '@/lib/project-api';
import { BudgetHealthCell } from './BudgetHealthCell';
import { ValueScoreCell } from './ValueScoreCell';
import { EffortCell } from './EffortCell';
import { CommitteeCell } from './CommitteeCell';

// Re-export PortfolioProject for components that import from this file
export type { PortfolioProject };

const columnHelper = createColumnHelper<PortfolioProject>();

export const portfolioColumns: ColumnDef<PortfolioProject, any>[] = [
  // Checkbox selection column
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },

  // Project ID - default sort descending (newest first)
  columnHelper.accessor('projectId', {
    id: 'projectId',
    header: 'Project ID',
    cell: (info) => (
      <span className="font-mono text-sm">{info.getValue()}</span>
    ),
    size: 130,
  }),

  // Name
  columnHelper.accessor('name', {
    id: 'name',
    header: 'Name',
    cell: (info) => (
      <span className="font-medium truncate max-w-[200px] block">
        {info.getValue()}
      </span>
    ),
    size: 200,
  }),

  // Status with color badge
  columnHelper.accessor('status', {
    id: 'status',
    header: 'Status',
    cell: (info) => {
      const status = info.getValue();
      if (!status) return <span className="text-muted-foreground">—</span>;
      return (
        <Badge
          className="text-white text-xs"
          style={{ backgroundColor: status.color }}
        >
          {status.name}
        </Badge>
      );
    },
    filterFn: (row, columnId, filterValue) => {
      const status = row.getValue(columnId) as { id: number; name: string } | undefined;
      return status?.id === filterValue;
    },
    size: 100,
  }),

  // Lead Team
  columnHelper.accessor('leadTeam', {
    id: 'leadTeam',
    header: 'Lead Team',
    cell: (info) => {
      const team = info.getValue();
      return team ? team.name : <span className="text-muted-foreground">—</span>;
    },
    filterFn: (row, columnId, filterValue) => {
      const team = row.getValue(columnId) as { id: number; name: string } | undefined;
      return team?.id === filterValue;
    },
    size: 120,
  }),

  // Project Manager
  columnHelper.accessor('projectManager', {
    id: 'pm',
    header: 'PM',
    cell: (info) => {
      const pm = info.getValue();
      return pm ? (
        <span className="truncate max-w-[100px] block text-sm">{pm}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    size: 100,
  }),

  // Value Score (mini radar chart)
  columnHelper.accessor('values', {
    id: 'valueScore',
    header: 'Value',
    cell: (info) => {
      const values = info.getValue();
      return <ValueScoreCell values={values} />;
    },
    enableSorting: false, // Can't meaningfully sort array
    size: 90,
  }),

  // Effort (team chips with T-shirts)
  columnHelper.accessor('teams', {
    id: 'effort',
    header: 'Effort',
    cell: (info) => {
      const row = info.row.original;
      const teams = info.getValue();
      return <EffortCell teams={teams || []} leadTeamId={row.leadTeamId} />;
    },
    enableSorting: false, // Can't meaningfully sort array
    size: 180,
  }),

  // Budget Health (progress bar)
  columnHelper.accessor((row) => ({ spent: row.actualsTotal, budget: row.budgetTotal }), {
    id: 'budgetHealth',
    header: 'Budget',
    cell: (info) => {
      const { spent, budget } = info.getValue();
      return <BudgetHealthCell spent={spent ?? 0} budget={budget ?? 0} />;
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original;
      const b = rowB.original;
      const pctA = a.budgetTotal ? (a.actualsTotal ?? 0) / a.budgetTotal : 0;
      const pctB = b.budgetTotal ? (b.actualsTotal ?? 0) / b.budgetTotal : 0;
      return pctA - pctB;
    },
    size: 120,
  }),

  // Committee step indicator
  columnHelper.accessor((row) => ({ state: row.committeeState, level: row.committeeLevel }), {
    id: 'committee',
    header: 'Committee',
    cell: (info) => {
      const { state, level } = info.getValue();
      return <CommitteeCell committeeState={state ?? null} committeeLevel={level ?? null} />;
    },
    size: 110,
  }),

  // Stopped indicator (hidden by default)
  columnHelper.accessor('isStopped', {
    id: 'stopped',
    header: 'State',
    cell: (info) => {
      return info.getValue() ? (
        <Badge variant="secondary">Stopped</Badge>
      ) : null;
    },
    size: 80,
  }),
];

// Default column visibility - all visible except 'stopped' column
export const defaultColumnVisibility: Record<string, boolean> = {
  select: true,
  projectId: true,
  name: true,
  status: true,
  leadTeam: true,
  pm: true,
  valueScore: true,
  effort: true,
  budgetHealth: true,
  committee: true,
  stopped: false,
};

// Default column order for drag-and-drop reordering
export const defaultColumnOrder = [
  'select',
  'projectId',
  'name',
  'status',
  'leadTeam',
  'pm',
  'valueScore',
  'effort',
  'budgetHealth',
  'committee',
  'stopped',
];
