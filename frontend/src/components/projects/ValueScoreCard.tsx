import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Outcome } from '@/lib/project-api';

interface ValueScoreCardProps {
  outcome: Outcome;
  score: number;
  justification: string | null;
  onChange: (score: number, justification: string | null) => void;
  disabled?: boolean;
}

function ScoreDots({ score }: { score: number }) {
  return (
    <span className="font-mono tracking-wide text-lg">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < score ? 'text-primary' : 'text-gray-300'}
        >
          {i < score ? '\u25CF' : '\u25CB'}
        </span>
      ))}
    </span>
  );
}

export function ValueScoreCard({
  outcome,
  score,
  justification,
  onChange,
  disabled,
}: ValueScoreCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getExampleText = (s: number) => {
    const examples: Record<number, string | null> = {
      1: outcome.score1Example,
      2: outcome.score2Example,
      3: outcome.score3Example,
      4: outcome.score4Example,
      5: outcome.score5Example,
    };
    return examples[s] || 'No example provided';
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full p-4 border rounded-lg hover:bg-muted/50 text-left transition-colors">
        <div className="flex justify-between items-center">
          <span className="font-medium">{outcome.name}</span>
          <div className="flex items-center gap-2">
            <ScoreDots score={score} />
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="border border-t-0 rounded-b-lg -mt-px">
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">
              Score (1-5)
            </label>
            <Slider
              value={[score]}
              onValueChange={disabled ? undefined : ([v]) => onChange(v, justification)}
              min={1}
              max={5}
              step={1}
              className="w-full"
              disabled={disabled}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1 - Minimal</span>
              <span>5 - Transformational</span>
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-md text-sm">
            <strong>Example for score {score}:</strong>
            <p className="mt-1 text-muted-foreground">{getExampleText(score)}</p>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              Justification (optional)
            </label>
            <Textarea
              value={justification || ''}
              onChange={(e) => onChange(score, e.target.value || null)}
              placeholder="Why did you choose this score?"
              rows={3}
              className="resize-none"
              disabled={disabled}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
