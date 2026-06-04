import { Card } from "./Card";
import type { Guess, Participant } from "../services/api";

interface ResultPanelProps {
  guesses: Guess[];
  participants: Participant[];
}

export function ResultPanel({ guesses, participants }: ResultPanelProps) {
  const getParticipantName = (id: string) =>
    participants.find((p) => p.id === id)?.name ?? "Unknown";

  if (guesses.length === 0) {
    return (
      <Card title="Activity">
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            No guesses yet. Waiting for players to submit their guesses.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Activity">
      <div style={{ display: "grid", gap: "8px" }}>
        {[...guesses].reverse().map((guess, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 14px",
              border: `1px solid ${guess.correct ? '#bbf7d0' : '#e5e7eb'}`,
              borderRadius: "8px",
              background: guess.correct ? '#f0fdf4' : '#ffffff',
              fontSize: "0.875rem"
            }}
          >
            <span>
              <strong>{getParticipantName(guess.participantId)}</strong>: {guess.text}
            </span>
            <span style={{ color: guess.correct ? '#16a34a' : '#6b7280', fontWeight: 600 }}>
              {guess.correct ? "✓ Correct" : ""}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
