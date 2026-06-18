import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();
  const participants = [...(room?.participants ?? [])].sort((a, b) => b.score - a.score);

  return (
    <Card title="Scoreboard">
      {participants.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <span>Waiting for players...</span>
        </div>
      ) : (
        <ul className="player-list">
          {participants.map((participant) => (
            <li key={participant.id}>
              <span>
                {participant.name}
                {participant.id === room?.drawerId ? " (drawer)" : ""}
              </span>
              <strong>{participant.score}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
