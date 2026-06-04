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
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {guesses.map((g, i) => (
            <li
              key={i}
              style={{
                padding: "4px 0",
                fontSize: "0.875rem",
                color: g.correct ? "#059669" : "#6b7280"
              }}
            >
              <strong>{g.participantName}</strong>: {g.text}
              {g.correct ? " ✓" : ""}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
