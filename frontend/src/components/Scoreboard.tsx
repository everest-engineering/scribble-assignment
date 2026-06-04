import { useRoomState } from "../state/roomStore";
import { Card } from "./Card";

export function Scoreboard() {
  const { room } = useRoomState();

  return (
    <Card title="Scoreboard">
      {room && room.participants.length > 0 ? (
        <ul className="player-list">
          {room.participants.map((p) => (
            <li key={p.id}>
              <span>{p.name}</span>
              <strong>{room.scores[p.id] ?? 0} pts</strong>
            </li>
          ))}
        </ul>
      ) : (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      )}
    </Card>
  );
}
