import { Card } from "./Card";
import type { Guess, ParticipantView } from "../services/api";

interface ResultPanelProps {
  status: "lobby" | "playing" | "result";
  secretWord?: string;
  participants: ParticipantView[];
  guesses: Guess[];
}

export function ResultPanel({ status, secretWord, participants, guesses }: ResultPanelProps) {
  if (status !== "result") {
    return (
      <Card title="Results">
        <p>Results will appear here when the round ends.</p>
      </Card>
    );
  }

  return (
    <Card title="Results">
      <p className="status-line" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
        The word was: <strong>{secretWord ?? "Unknown"}</strong>
      </p>

      <h3 style={{ marginTop: "16px", marginBottom: "8px", fontSize: "0.95rem" }}>Final Scores</h3>
      <ul className="player-list">
        {participants.map((participant) => (
          <li key={participant.id}>
            <span>{participant.name}</span>
            <span className="player-list__meta">{participant.score} pts</span>
          </li>
        ))}
      </ul>

      <h3 style={{ marginTop: "16px", marginBottom: "8px", fontSize: "0.95rem" }}>Guess History</h3>
      {guesses.length === 0 ? (
        <p>No guesses were submitted.</p>
      ) : (
        <ul className="player-list">
          {guesses.map((guess) => (
            <li key={guess.id}>
              <span>
                {guess.participantName}: {guess.text}
              </span>
              <span className="player-list__meta">{guess.isCorrect ? "correct" : "wrong"}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
