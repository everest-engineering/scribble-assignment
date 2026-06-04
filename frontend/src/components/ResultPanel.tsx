import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function ResultPanel() {
  const { room } = useRoomState();

  if (!room) {
    return null;
  }

  const latestGuesses = [...room.guesses].reverse();

  return (
    <Card title="Activity">
      <div className="guess-list" style={{ display: "grid", gap: "8px", maxHeight: "250px", overflowY: "auto" }}>
        {latestGuesses.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No guesses submitted yet.</p>
        ) : (
          latestGuesses.map((guess, index) => (
            <div
              key={index}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                backgroundColor: guess.isCorrect ? "#def7ec" : "#f9fafb",
                color: guess.isCorrect ? "#03543f" : "#1f2937",
                borderLeft: `4px solid ${guess.isCorrect ? "#31c48d" : "#e5e7eb"}`,
                fontSize: "0.9rem"
              }}
            >
              <strong>{guess.participantName}: </strong>
              <span>{guess.text}</span>
              {guess.isCorrect && <span style={{ marginLeft: "4px", fontWeight: "bold" }}>🎉 Correct!</span>}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
