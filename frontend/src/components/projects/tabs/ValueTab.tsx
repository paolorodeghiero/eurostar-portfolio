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
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

interface ValueTabProps {
  projectId: number;
  onProjectUpdated?: () => void;
  disabled?: boolean;
}

interface ScoreState {
  outcomeId: number;
  score: number;
  justification: string | null;
}

export function ValueTab({ projectId, onProjectUpdated, disabled }: ValueTabProps) {
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
      onProjectUpdated?.();
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

  // Transform scores for radar chart
  const values = Array.from(scores.values());
  const chartData = outcomes.map(o => {
    const scoreState = scores.get(o.id);
    return {
      dimension: o.name,
      score: scoreState?.score ?? 3,
      fullMark: 5,
    };
  });

  const averageScore = values.length > 0
    ? values.reduce((sum, v) => sum + (v.score ?? 3), 0) / values.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Large Radar Chart */}
      {outcomes.length > 0 && (
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Value Score Overview
            </h3>
            <span className="text-lg font-semibold">
              Avg: {averageScore.toFixed(1)} / 5
            </span>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 5]}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="border-t" />

      {/* Individual Scores */}
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Individual Scores
      </h3>
      <p className="text-sm text-muted-foreground">
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
