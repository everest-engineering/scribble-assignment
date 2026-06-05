import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();

  return (
    <Card title="Scoreboard">
      {!room ? (
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Waiting...</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {room.participants.map((p) => (
            <li
              key={p.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 0",
                fontSize: "0.875rem"
              }}
            >
              <span>{p.name}</span>
              <strong>{room.scores?.[p.id] ?? 0}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
