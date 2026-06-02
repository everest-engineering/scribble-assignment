import { Card } from "./Card";
import type { Guess } from "../services/api";

interface ResultPanelProps {
  status: "playing" | "result";
  revealedWord?: string;
  guesses: Guess[];
  isHost: boolean;
  onRestart?: () => Promise<void>;
  isRestarting?: boolean;
}

export function ResultPanel({
  status,
  revealedWord,
  guesses,
  isHost,
  onRestart,
  isRestarting = false
}: ResultPanelProps) {
  if (status === "playing") {
    return (
      <Card title="Guess History">
        {guesses.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No guesses yet.</p>
        ) : (
          <ul className="player-list">
            {guesses.map((guess, index) => (
              <li key={`${guess.participantId}-${guess.createdAt}-${index}`}>
                <span>
                  {guess.name}: {guess.text}
                </span>
                <span className="player-list__meta">{guess.correct ? "correct" : "incorrect"}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    );
  }

  return (
    <Card title="Round Result">
      <dl className="detail-list">
        <div>
          <dt>Word</dt>
          <dd>{revealedWord ?? "—"}</dd>
        </div>
      </dl>
      {guesses.length > 0 ? (
        <ul className="player-list" style={{ marginTop: "12px" }}>
          {guesses.map((guess, index) => (
            <li key={`${guess.participantId}-${guess.createdAt}-${index}`}>
              <span>
                {guess.name}: {guess.text}
              </span>
              <span className="player-list__meta">{guess.correct ? "correct" : "incorrect"}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No guesses were submitted.</p>
      )}
      {isHost && onRestart ? (
        <div className="button-row button-row--compact">
          <button className="button button--primary" type="button" disabled={isRestarting} onClick={onRestart}>
            {isRestarting ? "Restarting..." : "Restart Game"}
          </button>
        </div>
      ) : null}
    </Card>
  );
}
