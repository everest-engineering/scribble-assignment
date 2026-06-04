import { Card } from "./Card";
import type { GuessEntry } from "../services/api";

interface ResultPanelProps {
  guesses: GuessEntry[];
}

export function ResultPanel({ guesses = [] }: ResultPanelProps) {
  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No guesses yet.</p>
        </div>
      ) : (
        <ul className="guess-list">
          {guesses.map((entry, index) => (
            <li key={index} className={`guess-entry${entry.isCorrect ? " guess-entry--correct" : ""}`}>
              <span className="guess-entry__name">{entry.participantName}</span>
              <span className="guess-entry__text">{entry.guess}</span>
              <span className="guess-entry__result">
                {entry.isCorrect ? "✓ Correct!" : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
