import { Card } from "./Card";
import type { GuessRecord } from "../services/api";

interface ResultPanelProps {
  guesses: GuessRecord[];
}

export function ResultPanel({ guesses }: ResultPanelProps) {
  const ordered = [...guesses].reverse();

  return (
    <Card title="Activity">
      <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
        {ordered.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Game activity and guesses will appear here.
          </p>
        ) : (
          <ul className="player-list">
            {ordered.map((entry, index) => (
              <li key={`${entry.participantId}-${entry.at}-${index}`}>
                <span>
                  <strong>{entry.name}</strong>: {entry.guess}
                </span>
                <span
                  className="player-list__meta"
                  style={{ color: entry.correct ? "#15803d" : "#6b7280" }}
                >
                  {entry.correct ? "correct" : "incorrect"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
