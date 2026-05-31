import { useRoomState } from "../state/roomStore";
import { Card } from "./Card";

export function Scoreboard() {
  const { room } = useRoomState();

  const entries = room?.participants.map((p) => ({
    name: p.name,
    score: room.scores[p.id] ?? 0
  })) ?? [];

  return (
    <Card title="Scoreboard">
      {entries.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          {entries.map((entry) => (
            <div className="placeholder-row" key={entry.name}>
              <span>{entry.name}</span>
              <strong>{entry.score}</strong>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}