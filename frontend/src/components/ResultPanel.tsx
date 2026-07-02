import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function ResultPanel() {
  const { room } = useRoomState();

  return (
    <Card title="Guess History">
      {!room || room.guesses.length === 0 ? (
        <p className="placeholder-note">No guesses submitted yet.</p>
      ) : (
        <ul className="guess-history-list">
          {room.guesses.map((guess, index) => (
            <li
              className={`guess-history-list__item ${guess.correct ? "guess-history-list__item--correct" : "guess-history-list__item--incorrect"}`}
              key={`${guess.participantId}-${guess.timestamp}-${index}`}
            >
              <span>{guess.participantName}: {guess.text}</span>
              <strong>{guess.correct ? "Correct" : "Nope"}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
