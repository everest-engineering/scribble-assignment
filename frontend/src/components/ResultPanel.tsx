import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function ResultPanel() {
  const { room } = useRoomState();
  const guesses = room?.round?.guesses ?? [];

  return (
    <Card title="Activity">
      <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
        {guesses.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Game activity and guesses will appear here.
          </p>
        ) : (
          <ul className="guess-feed" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {guesses.map((guess) => (
              <li
                key={guess.id}
                style={{ fontSize: "0.875rem", padding: "2px 0", color: guess.correct ? "#15803d" : "#374151" }}
              >
                {guess.correct
                  ? `✅ ${guess.playerName} guessed the word!`
                  : `${guess.playerName}: ${guess.text}`}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
