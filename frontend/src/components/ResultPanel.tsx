import { Card } from "./Card";
import type { GuessEntry } from "../services/api";

interface ResultPanelProps {
  guesses: GuessEntry[];
}

export function ResultPanel({ guesses }: ResultPanelProps) {
  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Game activity and guesses will appear here.</p>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {guesses.map((entry, index) => (
            <li
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.875rem",
                color: entry.isCorrect ? "#16a34a" : "#dc2626",
              }}
            >
              <span>{entry.isCorrect ? "✓" : "✗"}</span>
              <strong>{entry.guesserName}</strong>
              <span>"{entry.guessText}"</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
