import { Card } from "./Card";
import type { GuessEntry } from "../services/api";

interface ResultPanelProps {
  guesses?: GuessEntry[];
  correctWord?: string | null;
}

export function ResultPanel({ guesses = [], correctWord = null }: ResultPanelProps) {
  return (
    <Card title={correctWord ? "Result" : "Activity"}>
      {correctWord ? (
        <div className="result-word">
          <span>Correct word</span>
          <strong>{correctWord}</strong>
        </div>
      ) : null}
      <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
        {guesses.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Game activity and guesses will appear here.</p>
        ) : (
          <ul className="activity-list">
            {guesses.map((guess) => (
              <li key={guess.id}>
                <span>
                  {guess.participantName}: {guess.text}
                </span>
                <strong>{guess.isCorrect ? "+100" : "+0"}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
