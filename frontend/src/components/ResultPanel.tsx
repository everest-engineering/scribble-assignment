import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function ResultPanel() {
  const { room } = useRoomState();
  const isRoundEnded = room?.roundPhase === "ended";

  return (
    <Card title="Activity">
      {isRoundEnded && room?.secretWord ? (
        <div className="placeholder-block" style={{ backgroundColor: "#ecfeff", marginBottom: "12px" }}>
          <p style={{ fontSize: "0.875rem", color: "#155e75" }}>
            Round complete. Correct word: <strong>{room.secretWord}</strong>
          </p>
        </div>
      ) : null}
      {!room || room.guessHistory.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Game activity and guesses will appear here.</p>
        </div>
      ) : (
        <ul className="activity-list">
          {room.guessHistory.map((guess) => (
            <li key={guess.id} className={guess.isCorrect ? "activity-list__item activity-list__item--correct" : "activity-list__item"}>
              <span>{guess.rawText}</span>
              <strong>{guess.pointsAwarded}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
