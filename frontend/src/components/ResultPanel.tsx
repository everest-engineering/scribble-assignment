import { Card } from "./Card";
import type { GuessSnapshot, RoomSnapshot } from "../services/api";

interface ResultPanelProps {
  guesses: GuessSnapshot[];
  status: RoomSnapshot["status"];
  secretWord: string | null;
}

export function ResultPanel({ guesses, status, secretWord }: ResultPanelProps) {
  return (
    <Card title={status === "result" ? "Round Result" : "Activity"}>
      <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
        {status === "result" && secretWord ? (
          <p
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "#059669",
              marginTop: 0,
              marginBottom: "12px"
            }}
          >
            The word was: {secretWord}
          </p>
        ) : null}
        {guesses.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
            Guesses will appear here as players submit them.
          </p>
        ) : (
          <ul className="guess-history" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {guesses.map((guess) => (
              <li
                key={guess.id}
                style={{
                  fontSize: "0.875rem",
                  padding: "6px 0",
                  borderBottom: "1px solid #e5e7eb",
                  color: guess.isCorrect ? "#059669" : "#374151"
                }}
              >
                <strong>{guess.participantName}</strong>: {guess.text}
                {guess.isCorrect ? " ✓" : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
