import { useRoomState } from "../state/roomStore";
import { Card } from "./Card";

export function Scoreboard() {
  const { room } = useRoomState();

  const sorted = room
    ? [...room.participants].sort((a, b) => b.score - a.score)
    : [];

  return (
    <Card title="Scoreboard">
      {sorted.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <ul className="player-list">
          {sorted.map((participant, index) => (
            <li key={participant.id}>
              <span>
                {index === 0 && sorted[0].score > 0 ? "🥇 " : ""}
                {participant.name}
                {participant.isHost ? (
                  <span style={{ fontSize: "0.75em", color: "#6b7280", marginLeft: "4px" }}>
                    (Host)
                  </span>
                ) : null}
              </span>
              <strong style={{ color: participant.score > 0 ? "#16a34a" : "#374151" }}>
                {participant.score} pts
              </strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
