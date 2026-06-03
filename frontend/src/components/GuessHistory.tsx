import type { GuessView } from "../services/api";
import { Card } from "./Card";

interface GuessHistoryProps {
  guesses: GuessView[];
}

export function GuessHistory({ guesses }: GuessHistoryProps) {
  return (
    <Card title="Guesses">
      {guesses.length === 0 ? (
        <p>No guesses yet. Start guessing!</p>
      ) : (
        <ul className="guess-list">
          {guesses.map((guess) => (
            <li key={guess.id} className={guess.correct ? "guess-list__item--correct" : undefined}>
              <span className="guess-list__author">{guess.playerName}</span>
              <span className="guess-list__text">{guess.text}</span>
              {guess.correct ? <span className="guess-list__badge">correct</span> : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
