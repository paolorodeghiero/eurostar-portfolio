import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  ArrowRight,
} from 'lucide-react';
import {
  fetchCommitteeStatus,
  transitionCommitteeState,
  STATE_LABELS,
  STATE_COLORS,
  LEVEL_LABELS,
  LEVEL_COLORS,
  type CommitteeStatus,
} from '@/lib/project-committee-api';

interface CommitteeTabProps {
  projectId: number;
  onProjectUpdated?: () => void;
  disabled?: boolean;
}

// Workflow states in order
const WORKFLOW_STATES = ['draft', 'presented', 'discussion', 'approved'];

export function CommitteeTab({ projectId, onProjectUpdated, disabled }: CommitteeTabProps) {
  const [status, setStatus] = useState<CommitteeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCommitteeStatus(projectId);
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load committee status');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleTransition = async (newState: string) => {
    if (disabled || transitioning) return;

    setTransitioning(true);
    setError(null);
    try {
      const result = await transitionCommitteeState(projectId, newState);
      setStatus(prev => prev ? {
        ...prev,
        committeeState: result.committeeState,
        allowedTransitions: result.allowedTransitions,
      } : null);
      onProjectUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transition state');
    } finally {
      setTransitioning(false);
    }
  };

  const getCurrentStateIndex = (state: string | null): number => {
    if (!state) return -1;
    if (state === 'rejected') return -2; // Special case for rejected
    return WORKFLOW_STATES.indexOf(state);
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading committee status...</div>;
  }

  if (!status) {
    return <div className="text-muted-foreground">Failed to load committee status</div>;
  }

  const currentStateIndex = getCurrentStateIndex(status.committeeState);
  const isRejected = status.committeeState === 'rejected';

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Engagement Level Summary */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Engagement Level
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {status.committeeLevel === 'mandatory' && 'Committee approval required for this budget level'}
            {status.committeeLevel === 'optional' && 'Committee review is optional'}
            {status.committeeLevel === 'not_necessary' && 'No committee review needed'}
            {!status.committeeLevel && 'Set project budget to determine level'}
          </p>
        </div>
        {status.committeeLevel ? (
          <Badge className={`text-lg px-4 py-1 ${LEVEL_COLORS[status.committeeLevel] || 'bg-gray-100 text-gray-800'}`}>
            {LEVEL_LABELS[status.committeeLevel] || status.committeeLevel}
          </Badge>
        ) : (
          <span className="text-muted-foreground">Not set</span>
        )}
      </div>

      {/* Divider */}
      <div className="border-t" />

      {/* Workflow Progress Visualization */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Workflow</h3>
        <div className="flex items-center gap-2 py-2">
          {WORKFLOW_STATES.map((state, index) => {
            const isCompleted = currentStateIndex >= index && !isRejected;
            const isCurrent = currentStateIndex === index && !isRejected;

            return (
              <div key={state} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                      isCompleted
                        ? 'bg-primary border-primary text-primary-foreground'
                        : isCurrent
                          ? 'border-primary text-primary'
                          : 'border-muted-foreground/30 text-muted-foreground/30'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1 ${
                      isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground/50'
                    }`}
                  >
                    {STATE_LABELS[state]}
                  </span>
                </div>
                {index < WORKFLOW_STATES.length - 1 && (
                  <ArrowRight
                    className={`h-4 w-4 mx-1 ${
                      currentStateIndex > index && !isRejected
                        ? 'text-primary'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        {isRejected && (
          <div className="flex items-center gap-2 mt-2">
            <Badge className={STATE_COLORS.rejected}>Rejected</Badge>
            <span className="text-sm text-muted-foreground">
              Project was rejected by the committee
            </span>
          </div>
        )}
      </div>

      {/* Current State and Transitions */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Current State</h3>
        <div className="flex items-center gap-3">
          {status.committeeState ? (
            <Badge className={STATE_COLORS[status.committeeState] || 'bg-gray-100 text-gray-800'}>
              {STATE_LABELS[status.committeeState] || status.committeeState}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">Not started</span>
          )}
        </div>

        {/* Transition Buttons */}
        {status.allowedTransitions.length > 0 && !disabled && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Available Actions</h4>
            <div className="flex flex-wrap gap-2">
              {status.allowedTransitions.map((transition) => (
                <Button
                  key={transition}
                  variant={transition === 'rejected' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => handleTransition(transition)}
                  disabled={transitioning}
                >
                  {transitioning ? 'Processing...' : `Move to ${STATE_LABELS[transition] || transition}`}
                </Button>
              ))}
            </div>
          </div>
        )}

        {disabled && status.allowedTransitions.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Project is stopped. Reactivate to change committee state.
          </p>
        )}
      </div>
    </div>
  );
}
