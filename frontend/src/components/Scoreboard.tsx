import { Card } from "./Card";
import type { Participant } from "../services/api";

interface ScoreboardProps {
  participants: Participant[];
  scores: Record<string, number>;
  drawerId: string;
}

export function Scoreboard({ participants, scores, drawerId }: ScoreboardProps) {
  const rows = participants
    .filter((p) => p.id !== drawerId)
    .map((p) => ({
      name: p.name,
      score: scores[p.id] ?? 0
    }));

  return (
    <Card title="Scoreboard">
      {rows.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <div className="scoreboard-list">
          {rows.map((row) => (
            <div key={row.name} className="scoreboard-row">
              <span>{row.name}</span>
              <strong>{row.score}</strong>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
