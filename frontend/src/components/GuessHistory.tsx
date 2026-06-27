import type { GuessEntry } from "../services/api";
import { Card } from "./Card";

interface GuessHistoryProps {
  guesses: GuessEntry[];
}

export function GuessHistory({ guesses }: GuessHistoryProps) {
  if (guesses.length === 0) {
    return (
      <Card title="Guesses">
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No guesses yet.</p>
      </Card>
    );
  }

  return (
    <Card title="Guesses">
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {guesses.map((entry, index) => (
          <li
            key={`${entry.participantId}-${index}`}
            style={{
              padding: "6px 0",
              borderBottom: index < guesses.length - 1 ? "1px solid #e5e7eb" : "none",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span>
              <strong>{entry.participantName}</strong>: {entry.guess}
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: "4px",
                backgroundColor: entry.correct ? "#dcfce7" : "#fee2e2",
                color: entry.correct ? "#16a34a" : "#dc2626"
              }}
            >
              {entry.correct ? "Correct" : "Wrong"}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
