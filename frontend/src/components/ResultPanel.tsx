import type { Guess } from "../services/api";
import { Card } from "./Card";

interface ResultPanelProps {
  guesses: Guess[];
}

export function ResultPanel({ guesses }: ResultPanelProps) {
  const recent = [...guesses].reverse();

  return (
    <Card title="Activity">
      <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
        {recent.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Guesses will appear here as players submit them.
          </p>
        ) : (
          <ul className="guess-list">
            {recent.map((guess) => (
              <li key={guess.id} className={guess.correct ? "guess-list__item--correct" : undefined}>
                <span className="guess-list__player">{guess.playerName}</span>
                <span className="guess-list__text">{guess.text}</span>
                {guess.correct ? <span className="guess-list__badge">correct</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
