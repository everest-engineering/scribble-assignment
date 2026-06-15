import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();

  if (!room) {
    return null;
  }

  const sortedParticipants = [...room.participants].sort((a, b) => b.score - a.score);

  return (
    <Card title="Scoreboard">
      {sortedParticipants.length === 0 ? (
        <p>No players yet.</p>
      ) : (
        <ul className="scoreboard-list">
          {sortedParticipants.map((participant) => (
            <li key={participant.id} className="scoreboard-list__item">
              <span>{participant.name}</span>
              <strong>{participant.score}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
