import type { Guess } from "../services/api";
import { Card } from "./Card";

interface ResultPanelProps {
  guesses: Guess[];
  secretWord: string | null;
  status: string;
}

export function ResultPanel({ guesses, secretWord, status }: ResultPanelProps) {
  if (status === "round_end") {
    return (
      <Card title="Round Complete">
        <div className="placeholder-block">
          <p style={{ fontWeight: 600 }}>The word was: <strong>{secretWord ?? "???"}</strong></p>
        </div>
        {guesses.length > 0 && (
          <div className="placeholder-block" style={{ marginTop: "12px" }}>
            <p style={{ fontWeight: 600 }}>Guess History</p>
            {guesses.map((g, i) => (
              <div key={i} className="placeholder-row">
                <span>{g.participantName}: {g.word}</span>
                <strong>{g.isCorrect ? "✓" : "✗"}</strong>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }

  if (guesses.length === 0) {
    return (
      <Card title="Activity">
        <div className="placeholder-block">
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No guesses yet.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Activity">
      <div className="placeholder-block">
        {guesses.map((g, i) => (
          <div key={i} className="placeholder-row">
            <span>{g.participantName}: {g.word}</span>
            <strong>{g.isCorrect ? "✓" : "✗"}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
}
