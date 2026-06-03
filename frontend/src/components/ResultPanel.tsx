import { Card } from "./Card";
import type { Guess, Participant } from "../services/api";

interface ResultPanelProps {
  guesses: Guess[];
  participants: Participant[];
}

export function ResultPanel({ guesses, participants }: ResultPanelProps) {
  function getName(participantId: string) {
    return participants.find((p) => p.id === participantId)?.name ?? "Unknown";
  }

  return (
    <Card title="Guess History">
      {guesses.length === 0 ? (
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No guesses yet</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {guesses.map((guess) => (
            <li key={guess.id} style={{ fontSize: "0.875rem" }}>
              <span style={{ fontWeight: 600 }}>{getName(guess.participantId)}</span>: {guess.text}{" "}
              {guess.correct
                ? <span style={{ color: "#16a34a" }}>✓ Correct</span>
                : <span style={{ color: "#dc2626" }}>✗ Incorrect</span>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
