import type { Guess } from "../services/api";
import { Card } from "./Card";

interface ResultPanelProps {
  guesses?: Guess[];
  secretWord?: string;
  status?: string;
}

export function ResultPanel({ guesses, secretWord, status }: ResultPanelProps) {
  const showGuesses = guesses && guesses.length > 0;

  return (
    <Card title={status === "result" ? "Round Over" : "Activity"}>
      {status === "result" && secretWord && (
        <p style={{ fontWeight: "bold", marginBottom: "8px" }}>
          The word was: {secretWord}
        </p>
      )}
      {showGuesses ? (
        <ul className="player-list">
          {guesses!.map((g, i) => (
            <li key={i}>
              <span>
                {g.participantName}: {g.text}
              </span>
              <span style={{ color: g.correct ? "#16a34a" : "#dc2626" }}>
                {g.correct ? "Correct!" : "Incorrect"}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {status === "result" ? "No guesses were submitted." : "Game activity and guesses will appear here."}
          </p>
        </div>
      )}
    </Card>
  );
}
