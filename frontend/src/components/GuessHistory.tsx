import type { Guess, Participant } from "../services/api";

interface GuessHistoryProps {
  guesses: Guess[];
  participants: Participant[];
}

export function GuessHistory({ guesses, participants }: GuessHistoryProps) {
  if (guesses.length === 0) {
    return <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No guesses yet.</p>;
  }

  function participantName(id: string) {
    return participants.find((p) => p.id === id)?.name ?? "Unknown";
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {guesses.map((guess) => (
        <li
          key={guess.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "4px 0",
            fontSize: "0.875rem"
          }}
        >
          <span style={{ flexShrink: 0, fontSize: "1rem" }}>
            {guess.isCorrect ? "✅" : "❌"}
          </span>
          <strong>{participantName(guess.participantId)}</strong>
          <span>{guess.text}</span>
        </li>
      ))}
    </ul>
  );
}
