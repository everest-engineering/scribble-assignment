import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();
  const participants = room?.participants ?? [];

  return (
    <Card title="Scoreboard">
      <div>
        {participants.length === 0 ? (
          <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
            <div className="placeholder-row">
              <span>Waiting for players...</span>
              <strong>0</strong>
            </div>
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
            {participants.map((participant) => (
              <li
                key={participant.id}
                className="placeholder-row"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px",
                  borderRadius: "6px",
                  backgroundColor: "#f9fafb"
                }}
              >
                <span>{participant.name}</span>
                <strong>{participant.score}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
