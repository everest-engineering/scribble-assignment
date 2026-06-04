import { useRoomState } from "../state/roomStore";
import { Card } from "./Card";

export function Scoreboard() {
  const { room } = useRoomState();

  if (!room) return null;

  return (
    <Card title="Scoreboard">
      <ul className="player-list">
        {room.participants.map((participant) => (
          <li key={participant.id}>
            <span>{participant.name}</span>
            <strong>{room.scores[participant.id] || 0}</strong>
          </li>
        ))}
      </ul>
    </Card>
  );
}
