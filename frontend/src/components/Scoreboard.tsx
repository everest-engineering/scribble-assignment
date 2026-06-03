import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room, participantId } = useRoomState();

  if (!room) return null;

  // Sort participants by score descending
  const sortedParticipants = [...room.participants].sort((a, b) => b.score - a.score);

  return (
    <Card title="Scoreboard">
      <div className="player-list">
        {sortedParticipants.map((p) => {
          const isYou = p.id === participantId;
          const isDrawer = p.id === room.drawerId;
          
          return (
            <div 
              key={p.id} 
              className="player-list__item" 
              style={{ 
                display: "flex", 
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid var(--color-gray-100)",
                fontWeight: isYou ? "bold" : "normal"
              }}
            >
              <div>
                <span>{p.name} {isYou && "(You)"}</span>
                {isDrawer && <span style={{ marginLeft: "8px", fontSize: "0.8em", color: "var(--color-primary-600)" }}>✏️</span>}
              </div>
              <strong>{p.score ?? 0}</strong>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
