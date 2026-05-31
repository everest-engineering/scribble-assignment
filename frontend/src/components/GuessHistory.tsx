import type { Guess } from "../services/api";
import { Card } from "./Card";

interface GuessHistoryProps {
  guesses: Guess[];
}

export function GuessHistory({ guesses }: GuessHistoryProps) {
  return (
    <Card title="Guess History">
      {guesses.length === 0 ? (
        <p>No guesses yet.</p>
      ) : (
        <ul className="guess-history">
          {guesses.map((guess) => (
            <li key={guess.id} className="guess-history__item">
              <span>
                <strong>{guess.participantName}</strong>: {guess.text}
              </span>
              <span className={guess.correct ? "guess-history__correct" : "guess-history__incorrect"}>
                {guess.correct ? "Correct" : "Incorrect"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
