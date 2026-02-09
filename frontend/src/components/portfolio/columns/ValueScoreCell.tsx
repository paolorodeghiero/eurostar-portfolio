interface ValueScoreCellProps {
  score: number; // Average or aggregate score 1-5
}

export function ValueScoreCell({ score }: ValueScoreCellProps) {
  // Round to nearest integer for display
  const displayScore = Math.round(score);

  return (
    <span className="font-mono tracking-wide text-base whitespace-nowrap">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < displayScore ? 'text-primary' : 'text-gray-300'}
        >
          {i < displayScore ? '\u25CF' : '\u25CB'}
        </span>
      ))}
    </span>
  );
}
