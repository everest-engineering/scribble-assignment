import type { GuessEntry, Participant } from "../services/api";
import { Card } from "./Card";

interface ResultPanelProps {
  guesses: GuessEntry[];
  secretWord: string | null;
  status: string;
  scores: Record<string, number>;
  participants: Participant[];
  viewerParticipantId: string | null;
}

export function ResultPanel({ guesses, secretWord, status, scores, participants }: ResultPanelProps) {
  const isFinished = status === "finished";

  return (
    <Card title={isFinished ? "Result" : "Activity"}>
      {isFinished ? (
        <div>
          <p className="result-word">
            The word was: <strong>{secretWord ?? "???"}</strong>
          </p>
          <h3 style={{ marginTop: "12px", fontSize: "0.875rem", fontWeight: 600 }}>Final Scores</h3>
          <div className="scoreboard-list">
            {participants.map((p) => (
              <div key={p.id} className="placeholder-row">
                <span>{p.name}</span>
                <strong>{scores[p.id] ?? 0}</strong>
              </div>
            ))}
          </div>
          {guesses.length > 0 && (
            <>
              <h3 style={{ marginTop: "12px", fontSize: "0.875rem", fontWeight: 600 }}>Guess History</h3>
              <ul className="guess-history">
                {guesses.map((g, i) => (
                  <li key={i} className={g.isCorrect ? "guess-correct" : "guess-incorrect"}>
                    <span className="guess-player">{g.participantName}:</span>
                    <span className="guess-text">{g.text}</span>
                    <span className="guess-result">{g.isCorrect ? "✓ Correct!" : "✗"}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          {guesses.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No guesses yet. Waiting for players...</p>
          ) : (
            <ul className="guess-history">
              {guesses.map((g, i) => (
                <li key={i} className={g.isCorrect ? "guess-correct" : "guess-incorrect"}>
                  <span className="guess-player">{g.participantName}:</span>
                  <span className="guess-text">{g.text}</span>
                  <span className="guess-result">{g.isCorrect ? "✓" : "✗"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
