import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();
  const participants = room?.participants ?? [];
  const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);

  return (
    <Card title="Scoreboard">
      {sortedParticipants.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <ul className="player-list" style={{ padding: 0, margin: 0 }}>
          {sortedParticipants.map((player) => (
            <li
              key={player.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px"
              }}
            >
              <span style={{ fontWeight: 600 }}>{player.name}</span>
              <strong style={{ fontSize: "1.1rem", color: "#2563eb" }}>{player.score}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
