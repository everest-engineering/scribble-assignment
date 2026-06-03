import type { ParticipantSnapshot } from "shared/schemas/index.js";
import { Card } from "./Card";

interface ScoreboardProps {
  participants: ParticipantSnapshot[];
  scores: Record<string, number>;
}

// T039: Renders live scores per participant.
export function Scoreboard({ participants, scores }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      <ul className="scoreboard-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {participants.map((p) => (
          <li
            key={p.id}
            className="scoreboard-row"
            style={{ display: "flex", justifyContent: "space-between", padding: "0.25rem 0" }}
          >
            <span>{p.name}</span>
            <strong>{scores[p.id] ?? 0}</strong>
          </li>
        ))}
      </ul>
    </Card>
  );
}
