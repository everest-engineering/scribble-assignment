import { Card } from "./Card";
import type { Guess } from "../services/api";

interface ResultPanelProps {
  guesses?: Guess[];
}

export function ResultPanel({ guesses = [] }: ResultPanelProps) {
  return (
    <Card title="Activity Log">
      {guesses.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Game activity and guesses will appear here.
          </p>
        </div>
      ) : (
        <div
          className="guess-log"
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            padding: "4px"
          }}
        >
          {guesses.map((guess) => (
            <div
              key={guess.id}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid",
                borderColor: guess.isCorrect ? "#bbf7d0" : "#e5e7eb",
                backgroundColor: guess.isCorrect ? "#f0fdf4" : "#f9fafb",
                color: guess.isCorrect ? "#15803d" : "#374151",
                fontSize: "0.875rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <strong>{guess.playerName}</strong>:{" "}
                <span style={{ fontStyle: guess.isCorrect ? "normal" : "italic", fontWeight: guess.isCorrect ? "600" : "normal" }}>
                  {guess.text}
                </span>
              </div>
              {guess.isCorrect ? (
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    background: "#22c55e",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "4px"
                  }}
                >
                  Correct! (+100)
                </span>
              ) : (
                <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                  {new Date(guess.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  })}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
