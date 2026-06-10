import { Card } from "./Card";
import type { Guess, Participant } from "../services/api";

interface ResultPanelProps {
  guesses: Guess[];
  participants: Participant[];
  revealed?: boolean;
  secretWord?: string | null;
}

export function ResultPanel({ guesses, participants, revealed, secretWord }: ResultPanelProps) {
  const participantName = (id: string) =>
    participants.find((p) => p.id === id)?.name ?? "Unknown";

  return (
    <Card title={revealed ? "Round Complete" : "Activity"}>
      {revealed && secretWord ? (
        <p style={{ fontWeight: "bold", marginBottom: "12px" }}>
          The word was: <span style={{ color: "#059669" }}>{secretWord}</span>
        </p>
      ) : null}

      {guesses.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            {revealed ? "No guesses were submitted." : "Game activity and guesses will appear here."}
          </p>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {guesses.map((g, i) => (
            <li
              key={`${g.timestamp}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 0",
                borderBottom: "1px solid #f3f4f6",
                fontSize: "0.875rem",
              }}
            >
              <span style={{ fontWeight: 500 }}>{participantName(g.participantId)}</span>
              <span style={{ color: "#6b7280" }}>guesses</span>
              <span>{g.text}</span>
              <span
                style={{
                  color: g.isCorrect ? "#059669" : "#dc2626",
                  fontWeight: 600,
                  marginLeft: "auto",
                }}
              >
                {g.isCorrect ? "✓ Correct" : "✗ Wrong"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
