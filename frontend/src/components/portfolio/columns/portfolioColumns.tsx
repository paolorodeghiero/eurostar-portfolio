import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { PortfolioProject } from '@/lib/project-api';
import { BudgetHealthCell } from './BudgetHealthCell';
import { ValueScoreCell } from './ValueScoreCell';
import { EffortCell } from './EffortCell';
import { ImpactCell } from './ImpactCell';
import { CommitteeCell } from './CommitteeCell';
import { LastActivityCell } from './LastActivityCell';
import { DateRangeCell } from './DateRangeCell';
import { CostTshirtCell } from './CostTshirtCell';

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

  // Dates (start - end)
  columnHelper.accessor((row) => ({ startDate: row.startDate, endDate: row.endDate }), {
    id: 'dates',
    header: 'Dates',
    cell: (info) => {
      const { startDate, endDate } = info.getValue();
      return <DateRangeCell startDate={startDate} endDate={endDate} />;
    },
    enableSorting: false,
    size: 130,
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

  // IS Owner
  columnHelper.accessor('isOwner', {
    id: 'isOwner',
    header: 'IS Owner',
    cell: (info) => {
      const owner = info.getValue();
      return owner ? (
        <span className="truncate max-w-[100px] block text-sm">{owner}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    size: 100,
  }),

  // Sponsor
  columnHelper.accessor('sponsor', {
    id: 'sponsor',
    header: 'Sponsor',
    cell: (info) => {
      const sponsor = info.getValue();
      return sponsor ? (
        <span className="truncate max-w-[100px] block text-sm">{sponsor}</span>
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
      const { row, table } = info;
      return (
        <ValueScoreCell
          values={values}
          onClick={() => table.options.meta?.onValueClick?.(row.original.id)}
        />
      );
    },
    enableSorting: false, // Can't meaningfully sort array
    size: 90,
  }),

  // Effort (expandable)
  columnHelper.accessor('teams', {
    id: 'effort',
    header: 'Effort',
    cell: ({ row }) => (
      <EffortCell
        teams={row.original.teams || []}
        isExpanded={row.getIsExpanded() && row.original._expandType === 'effort'}
        onToggleExpand={() => {
          if (row.getIsExpanded() && row.original._expandType === 'effort') {
            row.toggleExpanded(false);
          } else {
            row.original._expandType = 'effort';
            row.toggleExpanded(true);
          }
        }}
      />
    ),
    enableSorting: false,
    size: 100,
  }),

  // Impact (expandable)
  columnHelper.accessor('changeImpactTeams', {
    id: 'impact',
    header: 'Impact',
    cell: ({ row }) => (
      <ImpactCell
        impactTeams={row.original.changeImpactTeams || []}
        isExpanded={row.getIsExpanded() && row.original._expandType === 'impact'}
        onToggleExpand={() => {
          if (row.getIsExpanded() && row.original._expandType === 'impact') {
            row.toggleExpanded(false);
          } else {
            row.original._expandType = 'impact';
            row.toggleExpanded(true);
          }
        }}
      />
    ),
    enableSorting: false,
    size: 100,
  }),

  // Cost T-shirt
  columnHelper.accessor('costTshirt', {
    id: 'costTshirt',
    header: 'Cost',
    cell: (info) => <CostTshirtCell size={info.getValue()} />,
    size: 70,
  }),

  // Budget Health (progress bar with spent/total)
  columnHelper.accessor((row) => ({ spent: row.actualsTotal, budget: row.budgetTotal, currency: row.reportCurrency }), {
    id: 'budgetHealth',
    header: 'Budget',
    cell: (info) => {
      const { spent, budget, currency } = info.getValue();
      return (
        <BudgetHealthCell
          spent={parseFloat(String(spent ?? 0))}
          budget={parseFloat(String(budget ?? 0))}
          currency={currency || 'EUR'}
        />
      );
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original;
      const b = rowB.original;
      const pctA = a.budgetTotal ? (a.actualsTotal ?? 0) / a.budgetTotal : 0;
      const pctB = b.budgetTotal ? (b.actualsTotal ?? 0) / b.budgetTotal : 0;
      return pctA - pctB;
    },
    size: 140,
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

  // Last Activity
  columnHelper.accessor('updatedAt', {
    id: 'lastActivity',
    header: 'Last Activity',
    cell: (info) => <LastActivityCell updatedAt={info.getValue()} />,
    size: 120,
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

// Default column visibility - Core 8 visible by default
export const defaultColumnVisibility: Record<string, boolean> = {
  select: true,
  projectId: true,
  name: true,
  status: true,
  leadTeam: true,
  dates: true,
  valueScore: true,
  budgetHealth: true,
  committee: true,
  // Hidden by default:
  pm: false,
  isOwner: false,
  sponsor: false,
  effort: false,
  impact: false,
  costTshirt: false,
  lastActivity: false,
  stopped: false,
};

// Default column order for drag-and-drop reordering
export const defaultColumnOrder = [
  'select',
  'projectId',
  'name',
  'status',
  'leadTeam',
  'dates',
  'effort',
  'impact',
  'costTshirt',
  'valueScore',
  'budgetHealth',
  'committee',
  'pm',
  'isOwner',
  'sponsor',
  'lastActivity',
  'stopped',
];
