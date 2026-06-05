import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function ResultPanel() {
  const { room } = useRoomState();

  const guesses = room?.guesses ?? [];

  return (
    <Card title="Activity">
      <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
        {guesses.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Game activity and guesses will appear here.
          </p>
        ) : (
          guesses.map((guess) => {
            const name =
              room?.participants.find((p) => p.id === guess.guesserId)?.name ?? "Unknown player";
            return (
              <div key={guess.id} className="placeholder-row" style={{ alignItems: "flex-start", gap: "8px" }}>
                <span style={{ flex: 1 }}>
                  <strong>{name}</strong>: {guess.text}
                </span>
                <span style={{ color: guess.isCorrect ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                  {guess.isCorrect ? "✓" : "✗"}
                </span>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
