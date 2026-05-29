import type { Guess, Participant } from "../services/api";
import { Card } from "./Card";

interface ResultPanelProps {
  guesses: Guess[];
  participants: Participant[];
}

export function ResultPanel({ guesses, participants }: ResultPanelProps) {
  function nameFor(participantId: string) {
    return participants.find((p) => p.id === participantId)?.name ?? "Unknown";
  }

  return (
    <Card title="Guess History">
      {guesses.length === 0 ? (
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No guesses yet.</p>
      ) : (
        <ul className="player-list">
          {guesses.map((g, i) => (
            <li key={i} style={{ gap: "4px", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 500 }}>{nameFor(g.participantId)}</span>
              <span style={{ color: "#6b7280" }}>"{g.text}"</span>
              <span style={{ color: g.correct ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                {g.correct ? "✓" : "✗"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
