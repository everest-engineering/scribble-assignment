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
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Game activity and guesses will appear here.</p>
        </div>
      ) : (
        <ul className="guess-list">
          {guesses.map((g, i) => (
            <li key={i} className={`guess-list__item ${g.isCorrect ? "guess-list__item--correct" : ""}`}>
              <span className="guess-list__name">{g.participantName}</span>
              <span className="guess-list__text">{g.text}</span>
              <span className="guess-list__result">
                {g.isCorrect ? "Correct!" : "Wrong"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
