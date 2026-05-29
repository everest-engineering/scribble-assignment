import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function ResultPanel() {
  const { room } = useRoomState();
  const guesses = room?.currentRound?.guesses ?? [];

  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <p>Game activity and guesses will appear here.</p>
      ) : (
        <ul className="guess-history">
          {guesses.map((guess) => (
            <li key={guess.id} className={guess.isCorrect ? "guess-history__item guess-history__item--correct" : "guess-history__item"}>
              <div>
                <strong>{guess.participantName}</strong>
                <span>{guess.text}</span>
              </div>
              <span className="guess-history__result">{guess.isCorrect ? `Correct +${guess.pointsAwarded}` : "+0"}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
