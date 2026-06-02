import { useRoomState } from "../state/roomStore";
import { Card } from "./Card";

export function ResultPanel() {
  const { room } = useRoomState();

  const guesses = room?.guesses ?? [];

  return (
    <Card title={guesses.length > 0 ? `Activity (${guesses.length})` : "Activity"}>
      {guesses.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Game activity and guesses will appear here.
          </p>
        </div>
      ) : (
        <div className="guess-history">
          {guesses.map((guess, index) => (
            <div
              key={index}
              className={`guess-entry ${guess.isCorrect ? "guess-entry--correct" : "guess-entry--incorrect"}`}
            >
              <span className="guess-entry__name">{guess.participantName}</span>
              <span className="guess-entry__text">{guess.text}</span>
              <span className="guess-entry__result">
                {guess.isCorrect ? "+100 ✓" : "✗"}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
