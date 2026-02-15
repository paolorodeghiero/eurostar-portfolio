import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';

interface AuditEntry {
  id: number;
  tableName: string;
  recordId: number;
  changedBy: string;
  changedAt: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  changes: Record<string, { old?: any; new?: any }> | null;
}

export function AuditLogPage() {
  // State for filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [tableName, setTableName] = useState<string>('');
  const [changedBy, setChangedBy] = useState<string>('');
  const [operation, setOperation] = useState<string>('');

  // State for data
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  // Fetch with filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (tableName) params.set('tableName', tableName);
    if (changedBy) params.set('changedBy', changedBy);
    if (operation) params.set('operation', operation);
    params.set('limit', String(limit));
    params.set('offset', String(offset));

    apiClient<{ entries: AuditEntry[]; total: number }>(
      `/api/admin/audit-log?${params}`
    ).then((data) => {
      setEntries(data.entries);
      setTotal(data.total);
    });
  }, [startDate, endDate, tableName, changedBy, operation, offset]);

  const getOperationBadge = (operation: string) => {
    const variants = {
      INSERT: { variant: 'default' as const, className: 'bg-green-600' },
      UPDATE: { variant: 'default' as const, className: 'bg-blue-600' },
      DELETE: { variant: 'destructive' as const, className: '' },
    };
    const config = variants[operation as keyof typeof variants] || {
      variant: 'secondary' as const,
      className: '',
    };
    return (
      <Badge variant={config.variant} className={config.className}>
        {operation}
      </Badge>
    );
  };

  const formatChanges = (changes: Record<string, { old?: any; new?: any }> | null) => {
    if (!changes) return '-';
    const count = Object.keys(changes).length;
    return `${count} field${count !== 1 ? 's' : ''} changed`;
  };

  const columns: ColumnDef<AuditEntry>[] = [
    {
      accessorKey: 'changedAt',
      header: 'Date/Time',
      cell: ({ row }) => {
        const date = new Date(row.original.changedAt);
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {date.toLocaleDateString()} {date.toLocaleTimeString()}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(date, { addSuffix: true })}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'tableName',
      header: 'Table',
      cell: ({ row }) => (
        <code className="text-sm bg-muted px-2 py-0.5 rounded">
          {row.original.tableName}
        </code>
      ),
    },
    {
      accessorKey: 'recordId',
      header: 'Record ID',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          #{row.original.recordId}
        </span>
      ),
    },
    {
      accessorKey: 'changedBy',
      header: 'User',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.changedBy}</span>
      ),
    },
    {
      accessorKey: 'operation',
      header: 'Operation',
      cell: ({ row }) => getOperationBadge(row.original.operation),
    },
    {
      accessorKey: 'changes',
      header: 'Changes',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatChanges(row.original.changes)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <p className="text-muted-foreground">
          View all changes across the system
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
        <Input
          type="date"
          placeholder="Start date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-40"
        />
        <Input
          type="date"
          placeholder="End date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-40"
        />
        <Select value={tableName} onValueChange={setTableName}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All tables" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All tables</SelectItem>
            <SelectItem value="projects">projects</SelectItem>
            <SelectItem value="project_teams">project_teams</SelectItem>
            <SelectItem value="project_values">project_values</SelectItem>
            <SelectItem value="departments">departments</SelectItem>
            <SelectItem value="teams">teams</SelectItem>
            <SelectItem value="statuses">statuses</SelectItem>
            <SelectItem value="outcomes">outcomes</SelectItem>
            <SelectItem value="cost_centers">cost_centers</SelectItem>
            <SelectItem value="budget_lines">budget_lines</SelectItem>
            <SelectItem value="currency_rates">currency_rates</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Changed by email..."
          value={changedBy}
          onChange={(e) => setChangedBy(e.target.value)}
          className="w-48"
        />
        <Select value={operation} onValueChange={setOperation}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Operation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="INSERT">Insert</SelectItem>
            <SelectItem value="UPDATE">Update</SelectItem>
            <SelectItem value="DELETE">Delete</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => {
            setStartDate('');
            setEndDate('');
            setTableName('');
            setChangedBy('');
            setOperation('');
            setOffset(0);
          }}
        >
          Clear filters
        </Button>
      </div>

      {/* Audit entries table */}
      <DataTable columns={columns} data={entries} />

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
