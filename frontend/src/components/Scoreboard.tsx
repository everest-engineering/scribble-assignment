import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();

  if (!room || room.participants.length === 0) {
    return (
      <Card title="Scoreboard">
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      </Card>
    );
  }

  const sortedScores = [...room.participants].sort((a, b) => {
    const scoreA = room.scores[a.id] ?? 0;
    const scoreB = room.scores[b.id] ?? 0;
    return scoreB - scoreA;
  });

  return (
    <Card title="Scoreboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sortedScores.map((participant) => (
          <div
            key={participant.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px',
              backgroundColor: '#f9fafb',
              borderRadius: '4px'
            }}
          >
            <span><strong>{participant.name}</strong></span>
            <strong>{room.scores[participant.id] ?? 0}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
}
