import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function ResultPanel() {
  const { room } = useRoomState();
  const history = room?.guessHistory ?? [];

  const getName = (participantId: string) => {
    return room?.participants.find((p) => p.id === participantId)?.name ?? "Unknown";
  };

  return (
    <Card title="Activity">
      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        {history.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No guesses yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
            {history.map((entry, index) => (
              <li
                key={index}
                style={{
                  fontSize: "0.875rem",
                  padding: "8px",
                  borderRadius: "6px",
                  backgroundColor: entry.isCorrect ? "#dcfce7" : "#f3f4f6"
                }}
              >
                <strong>{getName(entry.participantId)}</strong>: {entry.guess}{" "}
                {entry.isCorrect && <span style={{ color: "#16a34a" }}>✓</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
