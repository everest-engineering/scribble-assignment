import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function ResultPanel() {
  const { room } = useRoomState();
  const guessHistory = room?.guessHistory ?? [];

  return (
    <Card title="Activity" badge={guessHistory.length > 0 ? `${guessHistory.length} guesses` : "Live feed"}>
      {guessHistory.length === 0 ? (
        <div className="placeholder-block">
          <p>Server-accepted guesses will appear here in order.</p>
        </div>
      ) : (
        <ul className="activity-feed">
          {guessHistory.map((entry, index) => (
            <li
              key={`${entry.participantId}-${entry.guess}-${index}`}
              className={`activity-feed__item${entry.isCorrect ? " activity-feed__item--correct" : ""}`}
            >
              <div className="activity-feed__row">
                <span className="activity-feed__name">{entry.participantName}</span>
                <span className={`activity-feed__tag${entry.isCorrect ? " activity-feed__tag--correct" : ""}`}>
                  {entry.isCorrect ? "correct" : "guess"}
                </span>
              </div>
              <p className="activity-feed__guess">{entry.guess}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
