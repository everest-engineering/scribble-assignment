import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  participants: Participant[];
  scores: Record<string, number>;
}

export function Scoreboard({ participants, scores }: ScoreboardProps) {
  if (participants.length === 0) {
    return (
      <Card title="Scoreboard">
        <div className="placeholder-block">
          <p>No players yet.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Scoreboard">
      <div className="placeholder-block">
        {participants.map((p) => (
          <div key={p.id} className="placeholder-row">
            <span>{p.name}</span>
            <strong>{scores[p.id] ?? 0}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
}
