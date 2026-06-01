import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();

  const participants = room?.participants ?? [];

  return (
    <Card title="Scoreboard">
      {participants.length === 0 ? (
        <div
          className="placeholder-block"
          style={{ backgroundColor: "#f9fafb" }}
        >
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <ul className="scoreboard-list">
          {participants.map((p) => (
            <li key={p.id} className="scoreboard-item">
              <span className="scoreboard-name">{p.name}</span>
              <strong className="scoreboard-score">
                {(p as any).score ?? 0}
              </strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
