import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();

  const participants = room?.participants ?? [];

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
        <ul className="player-list">
          {participants.map((p) => (
            <li key={p.id}>
              <span>{p.name}</span>
              <strong>{p.score}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
