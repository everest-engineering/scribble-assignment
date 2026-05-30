import { Card } from "./Card";
import type { Participant } from "../services/api";

interface ScoreboardProps {
  participants: Participant[];
}

export function Scoreboard({ participants }: ScoreboardProps) {
  if (participants.length === 0) {
    return (
      <Card title="Scoreboard">
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Waiting for players...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Scoreboard">
      <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
        {participants.map((participant) => (
          <div className="placeholder-row" key={participant.id}>
            <span>{participant.name}</span>
            <strong>{participant.score}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
}
