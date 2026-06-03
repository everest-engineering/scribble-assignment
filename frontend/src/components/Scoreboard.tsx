import { Card } from "./Card";
import type { Participant } from "../services/api";

interface ScoreboardProps {
  scores: Record<string, number>;
  participants: Participant[];
}

export function Scoreboard({ scores, participants }: ScoreboardProps) {
  const sorted = [...participants].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));

  return (
    <Card title="Scoreboard">
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {sorted.map((participant) => (
          <li key={participant.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
            <span>{participant.name}</span>
            <strong>{scores[participant.id] ?? 0} pts</strong>
          </li>
        ))}
      </ul>
    </Card>
  );
}
