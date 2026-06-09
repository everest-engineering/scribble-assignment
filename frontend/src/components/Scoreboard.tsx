import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  participants: Participant[];
  drawerId: string;
}

export function Scoreboard({ participants, drawerId }: ScoreboardProps) {
  if (participants.length === 0) {
    return (
      <Card title="Scoreboard">
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No participants</p>
      </Card>
    );
  }

  return (
    <Card title="Scoreboard">
      <ul className="scoreboard-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {participants.map((participant) => (
          <li
            key={participant.id}
            className="scoreboard-item"
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "0.375rem 0",
              borderBottom: "1px solid #f3f4f6",
              fontWeight: participant.id === drawerId ? 700 : 400
            }}
          >
            <span>
              {participant.name}
              {participant.id === drawerId ? " (drawer)" : ""}
            </span>
            <strong>{participant.score}</strong>
          </li>
        ))}
      </ul>
    </Card>
  );
}
