import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function ResultPanel() {
  const { room } = useRoomState();

  if (!room || room.guesses.length === 0) {
    return (
      <Card title="Activity">
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Game activity and guesses will appear here.
          </p>
        </div>
      </Card>
    );
  }

  const participantMap = Object.fromEntries(room.participants.map((p) => [p.id, p.name]));
  const reversedGuesses = [...room.guesses].reverse();

  return (
    <Card title="Activity">
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {reversedGuesses.map((guess, index) => (
          <li
            key={index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "4px 0",
              fontSize: "0.875rem",
              borderBottom: index < reversedGuesses.length - 1 ? "1px solid #f3f4f6" : "none"
            }}
          >
            <span>
              <span style={{ fontWeight: 600 }}>{participantMap[guess.participantId] ?? "Unknown"}</span>
              {": "}
              <span>{guess.text}</span>
            </span>
            <span
              aria-label={guess.isCorrect ? "Correct" : "Incorrect"}
              style={{ color: guess.isCorrect ? "#15803d" : "#dc2626", fontWeight: 700 }}
            >
              {guess.isCorrect ? "✓" : "✗"}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
