import { Card } from "./Card";
import type { RoomSnapshot } from "../services/api";

interface ResultPanelProps {
  room: RoomSnapshot;
  isHost: boolean;
  isLoading: boolean;
  onRestart: () => void;
}

export function ResultPanel({ room, isHost, isLoading, onRestart }: ResultPanelProps) {
  const hasGuesses = room.guesses.length > 0;

  return (
    <Card title={room.status === "result" ? "Result" : "Activity"}>
      {room.result ? (
        <div className="result-summary">
          <span className="status-line status-line--success">Round complete</span>
          <p>
            The word was <strong>{room.result.word}</strong>.
          </p>
        </div>
      ) : null}

      {hasGuesses ? (
        <ul className="guess-list">
          {room.guesses.map((guess) => (
            <li key={guess.id} className={guess.correct ? "guess-list__item--correct" : undefined}>
              <span>
                <strong>{guess.playerName}</strong>: {guess.text}
              </span>
              <em>{guess.correct ? `+${guess.scoreDelta}` : "+0"}</em>
            </li>
          ))}
        </ul>
      ) : (
        <p>No guesses submitted yet.</p>
      )}

      {room.status === "result" && isHost ? (
        <button className="button button--primary" type="button" disabled={isLoading} onClick={onRestart}>
          {isLoading ? "Restarting..." : "Restart to Lobby"}
        </button>
      ) : null}
    </Card>
  );
}
