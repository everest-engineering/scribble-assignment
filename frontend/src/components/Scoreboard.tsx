import { Card } from "./Card";
import type { RoomSnapshot } from "../services/api";

interface ScoreboardProps {
  room: RoomSnapshot;
}

export function Scoreboard({ room }: ScoreboardProps) {
  return <ScoreboardView room={room} />;
}

export function ScoreboardView({ room }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      <ol className="score-list">
        {[...room.participants]
          .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
          .map((participant) => (
            <li key={participant.id}>
              <span>{participant.name}</span>
              <strong>{participant.score}</strong>
            </li>
          ))}
      </ol>
    </Card>
  );
}
