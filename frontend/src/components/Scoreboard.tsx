import { useRoomState } from "../state/roomStore";
import { Card } from "./Card";

export function Scoreboard() {
  const { room } = useRoomState();

  return (
    <Card title="Scoreboard">
      {!room || room.participants.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <div className="scoreboard-list">
          {room.participants.map((participant) => (
            <div key={participant.id} className="scoreboard-row">
              <span className="scoreboard-name">{participant.name}</span>
              <strong className="scoreboard-value">{room.scores[participant.id] ?? 0}</strong>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
