import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();
  const participants = room?.participants ?? [];

  return (
    <Card title="Scoreboard">
      {participants.length === 0 ? (
        <p className="scoreboard__empty">Waiting for players...</p>
      ) : (
        <ul className="scoreboard">
          {participants.map((participant) => (
            <li key={participant.id} className="scoreboard__row">
              <span>{participant.name}</span>
              <strong>{participant.score ?? 0}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
