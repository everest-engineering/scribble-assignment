import { Card } from "./Card";
import type { RoomSnapshot } from "../services/api";

interface ResultPanelProps {
  room: RoomSnapshot;
}

export function ResultPanel({ room }: ResultPanelProps) {
  return <ResultPanelView room={room} />;
}

export function ResultPanelView({ room }: ResultPanelProps) {
  return (
    <Card title="Activity">
      {room.guesses.length === 0 ? (
        <p className="placeholder-note">No guesses yet</p>
      ) : (
        <ol className="guess-list">
          {room.guesses.map((guess) => (
            <li key={guess.id} className={guess.isCorrect ? "guess-list__item guess-list__item--correct" : "guess-list__item"}>
              <span>
                <strong>{guess.participantName}</strong>: {guess.text}
              </span>
              <span>{guess.scoreDelta > 0 ? `+${guess.scoreDelta}` : "0"}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
