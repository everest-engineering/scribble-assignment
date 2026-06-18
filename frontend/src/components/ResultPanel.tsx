import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function ResultPanel() {
  const { room } = useRoomState();
  const guesses = room?.guesses ?? [];

  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No guesses yet.</p>
        </div>
      ) : (
        <ul className="player-list">
          {[...guesses].reverse().map((guess) => (
            <li key={guess.id}>
              <span>
                <strong>{guess.name}:</strong> {guess.text}
              </span>
              <span
                className="player-list__meta"
                style={{ color: guess.correct ? "#15803d" : "#6b7280" }}
              >
                {guess.correct ? "correct" : "guess"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
