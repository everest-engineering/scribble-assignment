import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();

  return (
    <Card title="Scoreboard">
      <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
        {!room || room.participants.length === 0 ? (
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        ) : (
          room.participants.map((participant) => (
            <div className="placeholder-row" key={participant.id}>
              <span>{participant.name}</span>
              <strong>{room.scores[participant.id] ?? 0}</strong>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
