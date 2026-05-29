import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();

  if (!room) return null;

  // Sort by score descending
  const sortedParticipants = [...room.participants].sort((a, b) => b.score - a.score);

  return (
    <Card title="Scoreboard">
      <div className="scoreboard" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {sortedParticipants.map((participant) => (
          <div 
            key={participant.id} 
            className="scoreboard__row"
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '0.5rem',
              backgroundColor: participant.role === 'drawer' ? '#f0fdf4' : '#ffffff',
              borderRadius: '0.375rem',
              border: participant.role === 'drawer' ? '1px solid #bcf0da' : '1px solid #f3f4f6'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 500 }}>{participant.name}</span>
              <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'capitalize' }}>
                {participant.role}{participant.role === 'drawer' ? ' (Drawing)' : ''}
              </span>
            </div>
            <strong style={{ fontSize: '1.125rem' }}>{participant.score}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
}
