import { Card } from "./Card";
import type { PlayerScore } from "../services/api";

interface ScoreboardProps {
  scores: PlayerScore[];
}

export function Scoreboard({ scores }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      {scores.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Waiting for scores...</p>
      ) : (
        <ol className="scoreboard__list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '8px' }}>
          {scores.map((entry, index) => (
            <li key={entry.participantId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '8px', background: index === 0 ? '#fef3c7' : '#f9fafb' }}>
              <span style={{ fontWeight: 600, color: '#6b7280', minWidth: '20px' }}>{index + 1}</span>
              <span style={{ flex: 1, fontWeight: 500 }}>{entry.name}</span>
              <strong style={{ color: index === 0 ? '#92400e' : '#1f2937' }}>{entry.score}</strong>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
