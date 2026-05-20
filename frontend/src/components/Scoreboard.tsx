import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  participants: Participant[];
  scores: Record<string, number>;
}

export function Scoreboard({ participants, scores }: ScoreboardProps) {
  const sorted = [...participants]
    .map((p) => ({ name: p.name, score: scores[p.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  return (
    <Card title="Scoreboard">
      {sorted.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {sorted.map((entry, index) => (
            <li
              key={entry.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: index < sorted.length - 1 ? "1px solid #e5e7eb" : "none"
              }}
            >
              <span style={{ fontSize: "0.875rem" }}>{entry.name}</span>
              <strong style={{ fontSize: "0.875rem" }}>{entry.score}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
