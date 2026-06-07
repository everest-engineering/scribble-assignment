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
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Waiting for players...</p>
      </Card>
    );
  }

  return (
    <Card title="Scoreboard">
      <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
        {participants.map((p) => (
          <div className="placeholder-row" key={p.id}>
            <span>{p.name}</span>
            <strong>{scores[p.id] ?? 0}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
}
