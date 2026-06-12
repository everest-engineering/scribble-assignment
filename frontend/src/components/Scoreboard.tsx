import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  scores: Record<string, number>;
  participants: Participant[];
}

export function Scoreboard({ scores, participants }: ScoreboardProps) {
  const entries = participants
    .map((p) => ({ id: p.id, name: p.name, score: scores[p.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  if (entries.length === 0) {
    return (
      <Card title="Scoreboard">
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Waiting for players...</p>
      </Card>
    );
  }

  return (
    <Card title="Scoreboard">
      {entries.map((entry, i) => (
        <div
          key={entry.id}
          className="placeholder-row"
          style={{
            fontWeight: i === 0 && entry.score > 0 ? 700 : 400,
            color: i === 0 && entry.score > 0 ? "#16a34a" : "inherit"
          }}
        >
          <span>{entry.name}</span>
          <strong>{entry.score}</strong>
        </div>
      ))}
    </Card>
  );
}
