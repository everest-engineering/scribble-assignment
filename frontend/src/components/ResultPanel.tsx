import { Card } from "./Card";
import type { GuessSnapshot } from "../services/api";

interface ResultPanelProps {
  guesses?: GuessSnapshot[];
}

export function ResultPanel({ guesses = [] }: ResultPanelProps) {
  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <p className="guess-history__empty">No guesses yet.</p>
      ) : (
        <ul className="guess-history">
          {guesses.map((guess) => (
            <li key={guess.id} className="guess-history__item">
              <div className="guess-history__header">
                <span>{guess.participantName}</span>
                <span className={guess.isCorrect ? "guess-history__tag guess-history__tag--correct" : "guess-history__tag"}>
                  {guess.isCorrect ? "correct" : "incorrect"}
                </span>
              </div>
              <p className="guess-history__text">{guess.text}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
