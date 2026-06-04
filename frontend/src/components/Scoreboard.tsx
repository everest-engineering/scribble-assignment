import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();

  if (!room) {
    return null;
  }

  const sortedParticipants = [...room.participants].sort((a, b) => {
    const scoreA = room.scores[a.id] ?? 0;
    const scoreB = room.scores[b.id] ?? 0;
    return scoreB - scoreA;
  });

  return (
    <Card title="Scoreboard">
      <div className="scoreboard-list" style={{ display: 'grid', gap: '8px' }}>
        {sortedParticipants.map((participant) => {
          const score = room.scores[participant.id] ?? 0;
          return (
            <div
              key={participant.id}
              className="placeholder-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "var(--surface-strong)",
                borderRadius: "6px"
              }}
            >
              <span>
                {participant.name}
                {participant.id === room.hostId && " 👑"}
              </span>
              <strong>{score} pts</strong>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
