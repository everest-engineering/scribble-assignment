import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  participants: Participant[];
  scores: Record<string, number>;
}

export function Scoreboard({ participants, scores }: ScoreboardProps) {
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
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          {sorted.map((p) => (
            <div key={p.id} className="placeholder-row">
              <span>{p.name}</span>
              <strong>{scores[p.id] ?? 0}</strong>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
