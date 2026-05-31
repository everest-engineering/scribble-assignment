import type { RoomSnapshot } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  room: RoomSnapshot;
}

export function Scoreboard({ room }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      <ul className="scoreboard__list">
        {room.participants.map((participant) => (
          <li key={participant.id} className="scoreboard__item">
            <span>{participant.name}</span>
            <strong>{room.scores[participant.id] ?? 0}</strong>
          </li>
        ))}
      </ul>
    </Card>
  );
}
