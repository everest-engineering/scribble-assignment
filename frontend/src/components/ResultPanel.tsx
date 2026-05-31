import type { Guess } from "../services/api";
import { Card } from "./Card";

interface ResultPanelProps {
  guesses: Guess[];
}

export function ResultPanel({ guesses }: ResultPanelProps) {
  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No guesses yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.875rem" }}>
          {guesses.map((g, i) => (
            <li key={i} style={{ marginBottom: "6px", color: g.correct ? "#15803d" : "#374151" }}>
              <strong>{g.participantName}</strong>: "{g.guess}" — {g.correct ? "✓" : "✗"} {g.score} pts
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
