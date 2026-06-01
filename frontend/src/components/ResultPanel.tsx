import { useRoomState } from "../state/roomStore";
import { Card } from "./Card";

export function ResultPanel() {
  const { room } = useRoomState();

  if (!room || room.guesses.length === 0) {
    return (
      <Card title="Activity">
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Game activity and guesses will appear here.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Activity">
      <div
        className="placeholder-block"
        style={{ backgroundColor: "#f9fafb", maxHeight: "300px", overflowY: "auto" }}
      >
        {room.guesses.map((guess, idx) => (
          <div key={idx} className="placeholder-row" style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: "8px" }}>
            <span>
              <strong>{guess.participantName}:</strong> {guess.text}
            </span>
            <span style={{ color: guess.isCorrect ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
              {guess.isCorrect ? "Correct!" : "Incorrect"}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
