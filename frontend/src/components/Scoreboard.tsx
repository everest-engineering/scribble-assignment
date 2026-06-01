import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();

  if (!room) {
    return (
      <Card title="Scoreboard">
        <div
          className="placeholder-block"
          style={{ backgroundColor: "#f9fafb" }}
        >
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Scoreboard">
      {room.participants.map((participant) => (
        <div key={participant.id} className="scoreboard-row">
          <span>{participant.name}</span>
          <strong>{room.scores[participant.id] ?? 0}</strong>
        </div>
      ))}
    </Card>
  );
}
