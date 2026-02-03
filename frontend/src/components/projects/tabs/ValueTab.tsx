import { useEffect, useState } from 'react';
import { ValueScoreCard } from '../ValueScoreCard';
import {
  fetchOutcomes,
  fetchProjectValues,
  updateProjectValue,
  type Outcome,
  type ProjectValue,
} from '@/lib/project-api';
import { useDebouncedCallback } from 'use-debounce';

interface ValueTabProps {
  projectId: number;
  disabled?: boolean;
}

interface ScoreState {
  outcomeId: number;
  score: number;
  justification: string | null;
}

export function ValueTab({ projectId, disabled }: ValueTabProps) {
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [scores, setScores] = useState<Map<number, ScoreState>>(new Map());
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [o, v] = await Promise.all([
        fetchOutcomes(),
        fetchProjectValues(projectId),
      ]);
      setOutcomes(o);

      // Build scores map
      const scoresMap = new Map<number, ScoreState>();
      o.forEach((outcome) => {
        const existing = v.find((pv: ProjectValue) => pv.outcomeId === outcome.id);
        scoresMap.set(outcome.id, {
          outcomeId: outcome.id,
          score: existing?.score || 3, // Default to 3 (middle)
          justification: existing?.justification || null,
        });
      });
      setScores(scoresMap);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Debounced save to avoid too many API calls
  const debouncedSave = useDebouncedCallback(
    async (outcomeId: number, score: number, justification: string | null) => {
      await updateProjectValue(projectId, outcomeId, score, justification);
    },
    1000
  );

  const handleChange = (outcomeId: number, score: number, justification: string | null) => {
    setScores((prev) => {
      const next = new Map(prev);
      next.set(outcomeId, { outcomeId, score, justification });
      return next;
    });
    debouncedSave(outcomeId, score, justification);
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading value scores...</div>;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium mb-4">Value Scoring</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Rate the project's impact on each outcome dimension (1 = Minimal, 5 = Transformational).
      </p>

      <div className="space-y-2">
        {outcomes.map((outcome) => {
          const scoreState = scores.get(outcome.id);
          return (
            <ValueScoreCard
              key={outcome.id}
              outcome={outcome}
              score={scoreState?.score || 3}
              justification={scoreState?.justification || null}
              onChange={disabled ? () => {} : (s, j) => handleChange(outcome.id, s, j)}
              disabled={disabled}
            />
          );
        })}
      </div>
    </div>
  );
}
