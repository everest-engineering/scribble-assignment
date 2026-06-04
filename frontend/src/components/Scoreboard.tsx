import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();
  const participants = room?.participants ?? [];
  const sorted = [...participants].sort((a, b) => b.score - a.score);

  return (
    <Card title="Scoreboard">
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {sorted.map((participant) => (
          <div
            key={participant.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "6px 12px",
              backgroundColor: participant.hasGuessedCorrectly ? "#dcfce7" : "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "4px"
            }}
          >
            <span style={{ fontSize: "0.875rem", color: "#334155" }}>
              {participant.name}
              {participant.role === "drawer" ? " ✏️" : ""}
            </span>
            <strong style={{ fontSize: "0.875rem", color: "#0f172a" }}>
              {participant.score} pts
            </strong>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="placeholder-row">
            <span>No players in room</span>
          </div>
        )}
      </div>
    </Card>
  );
}
