import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function ResultPanel() {
  const { room } = useRoomState();
  const guesses = room?.guesses ?? [];

  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No guesses yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
          {guesses.map((g, i) => {
            const name = room?.participants.find((p) => p.id === g.participantId)?.name ?? "Unknown";
            return (
              <li
                key={i}
                style={{
                  fontSize: "0.875rem",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  backgroundColor: g.isCorrect ? "#dcfce7" : "#f9fafb",
                  color: g.isCorrect ? "#15803d" : "#374151"
                }}
              >
                <strong>{name}</strong>: {g.text}
                {g.isCorrect ? " ✓" : " ✗"}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
