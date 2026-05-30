import { Card } from "./Card";
import type { Guess, ResultSummary } from "../services/api";

interface ResultPanelProps {
  guesses: Guess[];
  result: ResultSummary | null;
}

export function ResultPanel({ guesses, result }: ResultPanelProps) {
  return (
    <Card title="Activity">
      <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
        {result ? (
          <>
            <p style={{ fontSize: "0.875rem", color: "#374151" }}>Correct word: {result.correctWord}</p>
            <p style={{ fontSize: "0.875rem", color: "#374151" }}>Winner: {result.winnerName}</p>
          </>
        ) : null}
        {guesses.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Game activity and guesses will appear here.</p>
        ) : (
          <ul className="guess-list">
            {guesses.map((guess) => (
              <li key={guess.id}>
                <span>{guess.playerName}</span>
                <strong>{guess.isCorrect ? "Correct" : guess.text}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
