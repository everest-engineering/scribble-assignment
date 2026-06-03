import { Card } from "./Card";
import type { GuessSnapshot, RoomSnapshot } from "../services/api";

interface ResultPanelProps {
  guesses: GuessSnapshot[];
  status: RoomSnapshot["status"];
}

export function ResultPanel({ guesses, status }: ResultPanelProps) {
  return (
    <Card title="Activity">
      <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
        {status === "result" ? (
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: 0 }}>
            Round over — full results and restart coming in Scenario 4.
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
