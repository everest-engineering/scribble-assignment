import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  scores: Record<string, number>;
  participants: Participant[];
}

export function Scoreboard({ scores, participants }: ScoreboardProps) {
  const sorted = [...participants].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));

  return (
    <Card title="Scoreboard">
      {sorted.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <ul className="player-list">
          {sorted.map((p) => (
            <li key={p.id}>
              <span>{p.name}</span>
              <strong>{scores[p.id] ?? 0} pts</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
