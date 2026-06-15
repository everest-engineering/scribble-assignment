import { Card } from "./Card";
import type { Guess } from "../services/api";

interface ResultPanelProps {
  guesses: Guess[];
  secretWord?: string;
  isRoundFinished: boolean;
}

export function ResultPanel({ guesses, secretWord, isRoundFinished }: ResultPanelProps) {
  return (
    <Card title="Activity">
      {isRoundFinished ? (
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontWeight: 600 }}>Round complete</p>
          {secretWord ? (
            <p style={{ marginTop: '8px' }}>
              Correct word: <strong>{secretWord}</strong>
            </p>
          ) : null}
        </div>
      ) : (
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Guess activity and shared history appear here.
        </p>
      )}

      {guesses.length === 0 ? (
        <p style={{ marginTop: '12px', color: '#6b7280' }}>No guesses yet.</p>
      ) : (
        <ul className="guess-history">
          {guesses.map((guess) => (
            <li key={guess.id} className="guess-history__item">
              <span>
                <strong>{guess.participantName}</strong>: {guess.text}
              </span>
              <span>{guess.isCorrect ? "✅" : "❌"}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
