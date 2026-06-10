import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();

  if (!room || Object.keys(room.scores).length === 0) {
    return (
      <Card title="Scoreboard">
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      </Card>
    );
  }

  const ranked = room.participants
    .map((p) => ({ name: p.name, score: room.scores[p.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  return (
    <Card title="Scoreboard">
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {ranked.map((entry) => (
          <li
            key={entry.name}
            style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.875rem" }}
          >
            <span>{entry.name}</span>
            <strong>{entry.score}</strong>
          </li>
        ))}
      </ul>
    </Card>
  );
}
