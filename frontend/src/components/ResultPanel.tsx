import { type Guess, type Participant } from "../services/api";
import { Card } from "./Card";

interface ResultPanelProps {
  guesses: Guess[];
  participants: Participant[];
}

export function ResultPanel({ guesses }: ResultPanelProps) {
  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          No guesses yet. Waiting for guessers...
        </p>
      ) : (
        <ul className="guess-history">
          {guesses.map((guess) => (
            <li key={guess.index} className={`guess-history__entry guess-history__entry--${guess.correct ? "correct" : "incorrect"}`}>
              <span className="guess-history__name">{guess.participantName}</span>
              <span className="guess-history__text">{guess.text}</span>
              <span className="guess-history__indicator">
                {guess.correct ? "✓" : "✗"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
