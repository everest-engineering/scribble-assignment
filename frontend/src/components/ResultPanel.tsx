import type { GuessSnapshot } from "shared/schemas/index.js";
import { Card } from "./Card";

interface ResultPanelProps {
  guesses: GuessSnapshot[];
}

// T042: Renders guess history with green highlighting for correct entries.
export function ResultPanel({ guesses }: ResultPanelProps) {
  return (
    <Card title="Activity">
      <div className="result-panel">
        {guesses.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Guesses will appear here.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {guesses.map((g) => (
              <li
                key={g.id}
                className={`guess-entry${g.correct ? " guess-entry--correct" : ""}`}
                style={{
                  padding: "0.25rem 0",
                  fontSize: "0.875rem",
                  color: g.correct ? "#16a34a" : undefined
                }}
              >
                <span className="guess-entry__name" style={{ fontWeight: 600 }}>
                  {g.participantName}
                </span>
                {": "}
                <span className="guess-entry__text">{g.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
