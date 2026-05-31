import { Card } from "./Card";
import type { Participant } from "../services/api";

interface ScoreboardProps {
  participants: Participant[];
  scores: Record<string, number>;
}

export function Scoreboard({ participants, scores }: ScoreboardProps) {
  const sorted = [...participants].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));

  return (
    <Card title="Scoreboard">
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {sorted.map((p) => (
          <li key={p.id} className="placeholder-row" style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
            <span>{p.name}</span>
            <strong>{scores[p.id] ?? 0}</strong>
          </li>
        ))}
      </ul>
    </Card>
  );
}
