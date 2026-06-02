import type { GuessEntry } from "../services/api";
import { Card } from "./Card";

interface ResultPanelProps {
  guesses: GuessEntry[];
}

export function ResultPanel({ guesses }: ResultPanelProps) {
  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No guesses yet.</p>
        </div>
      ) : (
        <ul className="guess-history">
          {guesses.map((g) => (
            <li key={g.id} className={`guess-history__item ${g.isCorrect ? "guess-history__item--correct" : ""}`}>
              <span className="guess-history__player">{g.playerName}</span>
              <span className="guess-history__value">{g.value}</span>
              {g.isCorrect ? <span className="guess-history__correct">Correct!</span> : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
