import type { Guess } from "../services/api";

interface ResultPanelProps {
  guesses: Guess[];
}

export function ResultPanel({ guesses }: ResultPanelProps) {
  if (guesses.length === 0) {
    return <p>No guesses yet. Activity will appear here.</p>;
  }

  return (
    <ul className="guess-history">
      {guesses.map((guess) => (
        <li key={guess.id} className={guess.correct ? "guess-history__item guess-history__item--correct" : "guess-history__item"}>
          <span className="guess-history__name">{guess.participantName}</span>
          <span className="guess-history__text">{guess.text}</span>
          {guess.correct ? <span className="guess-history__badge">Correct!</span> : null}
        </li>
      ))}
    </ul>
  );
}
