import { Card } from "./Card";
import type { GuessEntry, Participant, ParticipantScore } from "../services/api";

interface ResultPanelProps {
  guesses: GuessEntry[];
  isFinished?: boolean;
  secretWord?: string;
  scores?: ParticipantScore[];
  participants?: Participant[];
}

export function ResultPanel({
  guesses = [],
  isFinished = false,
  secretWord,
  scores = [],
  participants = []
}: ResultPanelProps) {
  if (isFinished) {
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    const nameMap = new Map(participants.map((p) => [p.id, p.name]));

    return (
      <Card title="Round Over">
        <p
          style={{
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "#059669"
          }}
        >
          The word was: <strong>{secretWord ?? "???"}</strong>
        </p>

        <h3 style={{ margin: "16px 0 8px", fontSize: "1rem" }}>
          Final Scores
        </h3>
        <ul className="score-list">
          {sorted.map((entry) => (
            <li key={entry.participantId} className="score-entry">
              <span className="score-entry__name">
                {nameMap.get(entry.participantId) ?? "Unknown"}
              </span>
              <strong className="score-entry__value">{entry.score}</strong>
            </li>
          ))}
        </ul>

        <h3 style={{ margin: "16px 0 8px", fontSize: "1rem" }}>
          Guesses
        </h3>
        <ul className="guess-list">
          {guesses.map((entry, index) => (
            <li
              key={index}
              className={`guess-entry${entry.isCorrect ? " guess-entry--correct" : ""}`}
            >
              <span className="guess-entry__name">{entry.participantName}</span>
              <span className="guess-entry__text">{entry.guess}</span>
              <span className="guess-entry__result">
                {entry.isCorrect ? "✓ Correct!" : ""}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    );
  }

  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            No guesses yet.
          </p>
        </div>
      ) : (
        <ul className="guess-list">
          {guesses.map((entry, index) => (
            <li
              key={index}
              className={`guess-entry${entry.isCorrect ? " guess-entry--correct" : ""}`}
            >
              <span className="guess-entry__name">{entry.participantName}</span>
              <span className="guess-entry__text">{entry.guess}</span>
              <span className="guess-entry__result">
                {entry.isCorrect ? "✓ Correct!" : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
