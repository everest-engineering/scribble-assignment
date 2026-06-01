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
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No guesses yet. Waiting for players to submit...</p>
        </div>
      ) : (
        <div className="guess-list">
          {guesses.map((guess) => (
            <div key={guess.id} className={`guess-row ${guess.isCorrect ? "guess-row--correct" : ""}`}>
              <div className="guess-row__header">
                <span className="guess-row__author">{guess.participantName}</span>
                {guess.pointsAwarded > 0 ? (
                  <span className="guess-row__points">+{guess.pointsAwarded}</span>
                ) : null}
              </div>
              <p className="guess-row__text">{guess.text}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
