import { memo } from 'react';
import { Radar, RadarChart, PolarGrid, ResponsiveContainer } from 'recharts';

interface ValueScore {
  outcomeName: string;
  score: number | null;
}

interface ValueScoreCellProps {
  values?: ValueScore[];
}

export const ValueScoreCell = memo(function ValueScoreCell({ values }: ValueScoreCellProps) {
  if (!values || values.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const data = values.map(v => ({
    dimension: v.outcomeName.substring(0, 3), // Truncate for mini display
    value: v.score ?? 0,
    fullMax: 5,
  }));

  return (
    <div className="w-[40px] h-[40px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <PolarGrid stroke="#e5e7eb" strokeWidth={0.5} />
          <Radar
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.5}
            dot={false}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
});
