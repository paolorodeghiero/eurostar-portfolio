import { Bell, RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAlerts, ALERT_TYPE_LABELS, SEVERITY_COLORS, type Alert } from '@/lib/alerts-api';
import { cn } from '@/lib/utils';

interface AlertsDropdownProps {
  onAlertClick?: (projectId: number) => void;
}

export function AlertsDropdown({ onAlertClick }: AlertsDropdownProps) {
  const { alerts, count, loading, error, refresh } = useAlerts();

  const handleAlertClick = (alert: Alert) => {
    // Extract numeric project ID from alert
    // The alert has projectId (string like "PRJ-2024-0001") but we need the numeric id
    // Look at the details for the numeric id
    const numericId = alert.details?.numericProjectId as number | undefined;
    if (numericId && onAlertClick) {
      onAlertClick(numericId);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold">Alerts</h4>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault();
              refresh();
            }}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {error ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Failed to load alerts
            </div>
          ) : loading && alerts.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Loading alerts...
            </div>
          ) : alerts.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No active alerts
            </div>
          ) : (
            <div className="divide-y">
              {alerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onClick={() => handleAlertClick(alert)}
                />
              ))}
            </div>
          )}
        </div>

        {count > 0 && (
          <div className="border-t px-4 py-2 text-center">
            <span className="text-xs text-muted-foreground">
              {count} active alert{count !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface AlertItemProps {
  alert: Alert;
  onClick?: () => void;
}

function AlertItem({ alert, onClick }: AlertItemProps) {
  const Icon = alert.type === 'overdue' ? Clock : AlertTriangle;
  const severityClass = SEVERITY_COLORS[alert.severity] || '';
  const typeLabel = ALERT_TYPE_LABELS[alert.type] || alert.type;

  return (
    <button
      className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex gap-3">
        <div className={cn('mt-0.5 rounded p-1', severityClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              {alert.projectId}
            </span>
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded',
              alert.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
            )}>
              {typeLabel}
            </span>
          </div>
          <p className="text-sm font-medium truncate mt-0.5">
            {alert.projectName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {alert.message}
          </p>
        </div>
      </div>
    </button>
  );
}
