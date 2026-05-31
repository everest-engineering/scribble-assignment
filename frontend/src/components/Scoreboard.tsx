import type { RoomSnapshot } from "../services/api";

interface ScoreboardProps {
  room: RoomSnapshot;
}

export function Scoreboard({ room }: ScoreboardProps) {
  return (
    <aside className="scoreboard">
      <h2>Scoreboard</h2>
      <ul className="scoreboard__list">
        {room.participants.map((participant) => (
          <li key={participant.id} className="scoreboard__item">
            <span>{participant.name}</span>
            <span>{room.scores[participant.id] ?? 0}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
