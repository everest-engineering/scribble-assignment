import { Card } from "./Card";
import type { Guess } from "../services/api";

interface ResultPanelProps {
  guesses: Guess[];
}

export function ResultPanel({ guesses }: ResultPanelProps) {
  return (
    <Card title="Activity">
      <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
        {guesses.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Game activity and guesses will appear here.
          </p>
        ) : (
          <ul className="guess-list">
            {guesses.map((guess, index) => (
              <li
                key={`${guess.participantId}-${index}`}
                className={`guess-list__item${guess.correct ? " guess-list__item--correct" : ""}`}
              >
                <span className="guess-list__marker">{guess.correct ? "✓" : "✗"}</span>
                <span className="guess-list__name">{guess.name}</span>
                <span className="guess-list__text">{guess.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
