import { Card } from "./Card";
import type { Guess } from "../services/api";

interface ResultPanelProps {
  guesses: Guess[];
}

export function ResultPanel({ guesses }: ResultPanelProps) {
  return (
    <Card title="Activity">
      <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
        {guesses.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            No guesses yet — activity will appear here.
          </p>
        ) : (
          <ul className="guess-history" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {guesses.map((guess) => (
              <li
                key={guess.id}
                style={{
                  fontSize: "0.875rem",
                  padding: "6px 0",
                  borderBottom: "1px solid #e5e7eb"
                }}
              >
                <strong>{guess.participantName}</strong>: {guess.text}
                {guess.isCorrect ? (
                  <span style={{ color: "#059669", marginLeft: "6px" }}>(correct)</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
