import type { GuessSnapshot } from "../services/api";
import { Card } from "./Card";

interface ResultPanelProps {
  guesses: GuessSnapshot[];
}

export function ResultPanel({ guesses }: ResultPanelProps) {
  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            No guesses yet. Waiting for players...
          </p>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: "300px", overflowY: "auto" }}>
          {guesses.map((guess, index) => (
            <li
              key={`${guess.participantId}-${index}`}
              style={{
                padding: "8px 12px",
                marginBottom: "4px",
                borderRadius: "6px",
                backgroundColor: guess.isCorrect ? "#d1fae5" : "#f9fafb",
                border: guess.isCorrect ? "1px solid #6ee7b7" : "1px solid #e5e7eb"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>{guess.guesserName}</span>
                <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                  {new Date(guess.submittedAt).toLocaleTimeString()}
                </span>
                {guess.isCorrect && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#059669",
                      backgroundColor: "#a7f3d0",
                      padding: "2px 6px",
                      borderRadius: "4px"
                    }}
                  >
                    Correct!
                  </span>
                )}
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "#374151" }}>{guess.text}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
