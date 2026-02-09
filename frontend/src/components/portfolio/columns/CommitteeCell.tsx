import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CommitteeCellProps {
  committeeLevel: string | null;
  committeeState: string | null;
}

const LEVEL_COLORS: Record<string, string> = {
  mandatory: 'bg-red-100 text-red-800 border-red-200',
  optional: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  not_necessary: 'bg-gray-100 text-gray-600 border-gray-200',
};

const LEVEL_LABELS: Record<string, string> = {
  mandatory: 'Mand',
  optional: 'Opt',
  not_necessary: 'N/A',
};

const WORKFLOW_STEPS = ['draft', 'presented', 'discussion'] as const;
const TERMINAL_STATES = ['approved', 'rejected'] as const;

function getStepIndex(state: string | null): number {
  if (!state) return -1;
  const idx = WORKFLOW_STEPS.indexOf(state as any);
  if (idx >= 0) return idx;
  // Terminal states are "after" discussion
  if (TERMINAL_STATES.includes(state as any)) return WORKFLOW_STEPS.length;
  return -1;
}

export const CommitteeCell = memo(function CommitteeCell({
  committeeLevel,
  committeeState,
}: CommitteeCellProps) {
  if (!committeeLevel) {
    return <span className="text-muted-foreground">—</span>;
  }

  const levelColor = LEVEL_COLORS[committeeLevel] || LEVEL_COLORS.not_necessary;
  const levelLabel = LEVEL_LABELS[committeeLevel] || committeeLevel;
  const currentStep = getStepIndex(committeeState);
  const isTerminal = committeeState && TERMINAL_STATES.includes(committeeState as any);

  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      {/* Level badge */}
      <Badge variant="outline" className={cn('text-xs px-1.5 py-0.5', levelColor)}>
        {levelLabel}
      </Badge>

      {/* Progression dots - only show if level is mandatory or optional */}
      {committeeLevel !== 'not_necessary' && (
        <div className="flex items-center gap-0.5">
          {WORKFLOW_STEPS.map((step, idx) => (
            <div
              key={step}
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                idx < currentStep
                  ? 'bg-primary'           // Completed
                  : idx === currentStep
                    ? 'bg-primary ring-2 ring-primary/30' // Current
                    : 'bg-muted'           // Future
              )}
              title={step}
            />
          ))}
          {/* Terminal state indicator */}
          {isTerminal && (
            <div
              className={cn(
                'w-1.5 h-1.5 rounded-full ml-0.5',
                committeeState === 'approved' ? 'bg-green-500' : 'bg-red-500'
              )}
              title={committeeState || ''}
            />
          )}
        </div>
      )}

      {/* State text - only first letter capitalized */}
      {committeeState && (
        <span className={cn(
          'text-xs',
          committeeState === 'approved' ? 'text-green-600' :
          committeeState === 'rejected' ? 'text-red-600' :
          'text-muted-foreground'
        )}>
          {committeeState.charAt(0).toUpperCase() + committeeState.slice(1)}
        </span>
      )}
    </div>
  );
});
