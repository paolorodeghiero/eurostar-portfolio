import { memo } from 'react';
import { Radar, RadarChart, PolarGrid, ResponsiveContainer, Tooltip } from 'recharts';

interface ValueScore {
  outcomeName: string;
  score: number | null;
}

interface ValueScoreCellProps {
  values?: ValueScore[];
  onClick?: () => void;
}

export const ValueScoreCell = memo(function ValueScoreCell({ values, onClick }: ValueScoreCellProps) {
  if (!values || values.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const data = values.map(v => ({
    dimension: v.outcomeName.substring(0, 3), // Truncate for mini display
    value: v.score ?? 0,
    fullMax: 5,
    fullName: v.outcomeName, // Keep full name for tooltip
  }));

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    onClick?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onClick?.();
    }
  };

  return (
    <div
      className="w-[40px] h-[40px] cursor-pointer"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="View value scores"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <PolarGrid stroke="#e5e7eb" strokeWidth={0.5} />
          <Tooltip
            formatter={(value: any, _name: any, props: any) => {
              const fullName = props.payload.fullName || props.payload.dimension;
              return [`${value ?? 0}/5`, fullName];
            }}
            position={{ x: 50, y: 0 }}
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              padding: '8px 12px',
              opacity: 1,
            }}
            wrapperStyle={{
              zIndex: 1000,
            }}
            labelStyle={{
              display: 'none', // Hide default label
            }}
          />
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
