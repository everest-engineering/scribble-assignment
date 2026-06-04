import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();

  return (
    <Card title="Scoreboard">
      {!room || room.participants.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          {room.participants.map((p) => (
            <div key={p.id} className="placeholder-row">
              <span>{p.name}{p.id === room.drawerId ? " (Drawer)" : ""}</span>
              <strong>{room.scores[p.id] ?? 0}</strong>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
