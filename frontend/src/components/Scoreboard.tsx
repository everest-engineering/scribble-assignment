import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  participants: Participant[];
  scores: Record<string, number>;
  drawerId: string | null;
}

export function Scoreboard({ participants, scores, drawerId }: ScoreboardProps) {
  if (participants.length === 0) {
    return (
      <Card title="Scoreboard">
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Scoreboard">
      <div className="scoreboard-list">
        {participants.map((p) => (
          <div key={p.id} className="placeholder-row">
            <span>
              {p.name}
              {p.id === drawerId ? <span className="role-badge"> (drawer)</span> : null}
            </span>
            <strong>{scores[p.id] ?? 0}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
}
