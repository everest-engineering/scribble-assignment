import type { Guess } from "../services/api";
import { Card } from "./Card";

interface ResultPanelProps {
  guesses: Guess[];
}

export function ResultPanel({ guesses }: ResultPanelProps) {
  if (guesses.length === 0) {
    return (
      <Card title="Activity">
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No guesses yet. Waiting for players to guess...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Activity">
      <ul className="player-list">
        {guesses.map((g, i) => (
          <li key={i}>
            <span>{g.playerName}: {g.text}</span>
            <span style={{ color: g.isCorrect ? "#059669" : "#6b7280", fontWeight: g.isCorrect ? 600 : 400 }}>
              {g.isCorrect ? "Correct!" : "Incorrect"}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
