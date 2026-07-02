import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room, participantId } = useRoomState();

  return (
    <Card title="Scoreboard">
      {!room ? (
        <p className="placeholder-note">Waiting for room data...</p>
      ) : (
        <ul className="scoreboard-list">
          {room.participants.map((participant) => (
            <li
              className={`scoreboard-list__item ${participant.id === participantId ? "scoreboard-list__item--self" : ""}`}
              key={participant.id}
            >
              <span>{participant.name}</span>
              <strong>{room.scores[participant.id] ?? 0}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
