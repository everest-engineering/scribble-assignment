import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();
  const participants = room?.participants ?? [];
  const scores = room?.scores ?? {};

  return (
    <Card title="Scoreboard">
      {participants.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {participants.map((p) => (
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
              <strong>{scores[p.id] ?? 0}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
