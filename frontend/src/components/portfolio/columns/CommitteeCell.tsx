import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const WORKFLOW_STATES = ['draft', 'presented', 'discussion', 'approved'];
const STATE_ABBREV: Record<string, string> = {
  draft: 'D',
  presented: 'P',
  discussion: 'Ds',
  approved: 'A',
  rejected: 'R',
};

interface CommitteeCellProps {
  committeeState: string | null;
  committeeLevel: string | null;
}

export function CommitteeCell({ committeeState, committeeLevel }: CommitteeCellProps) {
  // If no committee level or not_necessary, show dash
  if (!committeeLevel || committeeLevel === 'not_necessary') {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  if (!committeeState) {
    return <span className="text-xs text-muted-foreground">Not started</span>;
  }

  // Special case for rejected
  if (committeeState === 'rejected') {
    return (
      <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
        Rejected
      </span>
    );
  }

  const currentIndex = WORKFLOW_STATES.indexOf(committeeState);

  return (
    <div className="flex items-center gap-0.5">
      {WORKFLOW_STATES.map((state, index) => {
        const isCompleted = currentIndex >= index;
        const isCurrent = currentIndex === index;

        return (
          <div
            key={state}
            className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium',
              isCompleted
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground',
              isCurrent && 'ring-2 ring-primary ring-offset-1'
            )}
            title={state.charAt(0).toUpperCase() + state.slice(1)}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              STATE_ABBREV[state]
            )}
          </div>
        );
      })}
    </div>
  );
}
