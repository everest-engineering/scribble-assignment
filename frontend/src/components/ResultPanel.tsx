import { Card } from "./Card";
import type { Guess } from "../services/api";

interface ResultPanelProps {
  guesses: Guess[];
}

export function ResultPanel({ guesses }: ResultPanelProps) {
  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No guesses yet.</p>
      ) : (
        <ul className="player-list">
          {guesses.map((g, i) => (
            <li key={i}>
              <span>{g.participantName}: {g.text}</span>
              <span className="player-list__meta" style={{ color: g.isCorrect ? "#16a34a" : "#dc2626" }}>
                {g.isCorrect ? "correct" : "wrong"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
