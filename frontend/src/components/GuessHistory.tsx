import type { Guess } from "../services/api";

interface GuessHistoryProps {
  guesses: Guess[];
}

export function GuessHistory({ guesses }: GuessHistoryProps) {
  if (guesses.length === 0) {
    return <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)" }}>No guesses yet.</p>;
  }

  return (
    <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
      {guesses.map((guess, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 8,
            background: guess.isCorrect ? "var(--green-100, #d1fae5)" : "var(--surface-muted)",
            fontSize: "0.875rem"
          }}
        >
          <span style={{ fontWeight: 600, minWidth: 60, overflow: "hidden", textOverflow: "ellipsis" }}>
            {guess.guesserName}
          </span>
          <span style={{ flex: 1 }}>{guess.text}</span>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 4,
              background: guess.isCorrect ? "var(--green-500, #10b981)" : "var(--red-500, #ef4444)",
              color: "#fff"
            }}
          >
            {guess.isCorrect ? "CORRECT" : "WRONG"}
          </span>
        </div>
      ))}
    </div>
  );
}
