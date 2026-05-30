import { Card } from "./Card";
import type { RoomSnapshot } from "../services/api";

interface ScoreboardProps {
  room: RoomSnapshot;
}

export function Scoreboard({ room }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      {room.participants.length === 0 ? (
        <p>No participants yet.</p>
      ) : (
        <ul className="scoreboard-list">
          {room.participants.map((participant) => (
            <li key={participant.id} className="scoreboard-list__row">
              <span>{participant.name}</span>
              <strong>{participant.score ?? 0}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
