import { Card } from "./Card";
import type { GuessEntry } from "../services/api";

interface ResultPanelProps {
  guesses: GuessEntry[];
}

export function ResultPanel({ guesses }: ResultPanelProps) {
  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <p>No guesses yet.</p>
      ) : (
        <ul className="guess-history">
          {guesses.map((guess) => (
            <li key={guess.id} className={guess.isCorrect ? "guess-history__item guess-history__item--correct" : "guess-history__item"}>
              <span>
                <strong>{guess.participantName}</strong>: {guess.text}
              </span>
              <span>{guess.isCorrect ? `Correct +${guess.pointsAwarded}` : "Incorrect"}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
