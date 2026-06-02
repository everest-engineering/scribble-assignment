import type { Guess } from "../services/api";
import { Card } from "./Card";

interface ResultPanelProps {
  guesses: Guess[];
}

export function ResultPanel({ guesses }: ResultPanelProps) {
  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No guesses yet.</p>
        </div>
      ) : (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          {guesses.map((guess, index) => (
            <div key={index} className="placeholder-row" style={{ color: guess.correct ? '#16a34a' : '#6b7280' }}>
              <span>
                <strong>{guess.playerName}</strong>: {guess.text}
              </span>
              <span>{guess.correct ? "✓" : ""}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
