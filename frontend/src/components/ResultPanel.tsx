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
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {guesses.map((g, index) => (
            <li
              key={index}
              style={{
                padding: "4px 8px",
                marginBottom: "4px",
                borderRadius: "4px",
                fontSize: "0.875rem",
                backgroundColor: g.correct ? "#dcfce7" : "#fee2e2",
                color: g.correct ? "#166534" : "#991b1b"
              }}
            >
              {g.participantName}: {g.text}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
