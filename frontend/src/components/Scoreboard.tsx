import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();
  const scores = room?.scores;
  const participants = room?.participants ?? [];

  return (
    <Card title="Scoreboard">
      {!scores || participants.length === 0 ? (
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Waiting for game to start.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
          {participants.map((p) => (
            <li
              key={p.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 8px",
                borderRadius: "4px",
                backgroundColor: "#f9fafb",
                fontSize: "0.875rem"
              }}
            >
              <span>{p.name}</span>
              <strong>{scores[p.id] ?? 0}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
