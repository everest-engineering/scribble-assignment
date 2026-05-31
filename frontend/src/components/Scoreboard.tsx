import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  scores: Record<string, number>;
  participants: Participant[];
}

export function Scoreboard({ scores, participants }: ScoreboardProps) {
  const sorted = [...participants].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));

  return (
    <Card title="Scoreboard">
      {sorted.length === 0 ? (
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No players.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {sorted.map((p) => (
            <li key={p.id} className="placeholder-row" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{p.name}</span>
              <strong>{scores[p.id] ?? 0} pts</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
