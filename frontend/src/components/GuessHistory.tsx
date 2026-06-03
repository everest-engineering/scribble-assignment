import type { Guess } from "../services/api";

interface GuessHistoryProps {
  guesses: Guess[];
}

export function GuessHistory({ guesses }: GuessHistoryProps) {
  if (guesses.length === 0) {
    return <p className="guess-history--empty">No guesses yet.</p>;
  }

  return (
    <ul className="guess-history">
      {guesses.map((guess) => (
        <li key={guess.id} className={`guess-history__item ${guess.correct ? "guess-history__item--correct" : ""}`}>
          <span className="guess-history__player">{guess.playerName}</span>
          <span className="guess-history__text">{guess.text}</span>
          <span className="guess-history__result">{guess.correct ? "✓ Correct" : "✗ Wrong"}</span>
        </li>
      ))}
    </ul>
  );
}
