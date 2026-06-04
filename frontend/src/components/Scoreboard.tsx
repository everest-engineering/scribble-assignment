import { Card } from "./Card";

interface ScoreboardProps {
  scores: Record<string, number>;
  participants: { id: string; name: string }[];
}

export function Scoreboard({ scores, participants }: ScoreboardProps) {
  const entries = participants
    .map((p) => ({
      name: p.name,
      score: scores[p.id] ?? 0
    }))
    .sort((a, b) => b.score - a.score);

  if (entries.length === 0) {
    return (
      <Card title="Scoreboard">
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Scoreboard">
      <div style={{ display: "grid", gap: "12px" }}>
        {entries.map((entry) => (
          <div
            key={entry.name}
            className="placeholder-row"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              background: "#f9fafb"
            }}
          >
            <span style={{ fontWeight: 500 }}>{entry.name}</span>
            <strong style={{ fontSize: "1.125rem" }}>{entry.score}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
}
