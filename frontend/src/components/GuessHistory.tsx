import { Card } from "./Card";
import type { Guess } from "../services/api";

interface GuessHistoryProps {
  guesses: Guess[];
}

export function GuessHistory({ guesses }: GuessHistoryProps) {
  const sorted = [...guesses].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Card title="Guess History">
      {sorted.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            No guesses yet. Waiting for players to submit their guesses...
          </p>
        </div>
      ) : (
        <ul className="guess-history">
          {sorted.map((guess, index) => (
            <li
              key={`${guess.participantId}-${index}`}
              className={`guess-entry ${guess.isCorrect ? "guess-entry--correct" : ""}`}
            >
              <span className="guess-entry__player">{guess.playerName}</span>
              <span className="guess-entry__text">{guess.text}</span>
              <span className={`guess-entry__badge ${guess.isCorrect ? "guess-entry__badge--correct" : "guess-entry__badge--incorrect"}`}>
                {guess.isCorrect ? "Correct" : "Wrong"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
