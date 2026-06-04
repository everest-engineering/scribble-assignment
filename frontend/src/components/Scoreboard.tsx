import { Card } from "./Card";
import type { Participant } from "../services/api";

interface ScoreboardProps {
  participants: Participant[];
}

export function Scoreboard({ participants }: ScoreboardProps) {
  const sorted = [...participants].sort((a, b) => b.score - a.score);
  return (
    <Card title="Scoreboard">
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {sorted.map((p) => (
          <li key={p.id} className="placeholder-row" style={{ justifyContent: "space-between" }}>
            <span>{p.name}</span>
            <strong>{p.score}</strong>
          </li>
        ))}
      </ul>
    </Card>
  );
}
