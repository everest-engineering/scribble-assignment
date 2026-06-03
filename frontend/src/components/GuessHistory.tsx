import { useRoomState } from "../state/roomStore";
import { Card } from "./Card";

export function GuessHistory() {
  const { room } = useRoomState();
  
  if (!room) return null;

  return (
    <Card title="Guess History">
      <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {room.guesses.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>No guesses yet.</div>
        ) : (
          room.guesses.map(guess => (
            <div key={guess.id} style={{
              padding: '0.5rem', 
              backgroundColor: guess.isCorrect ? '#dcfce7' : '#f3f4f6',
              borderLeft: guess.isCorrect ? '4px solid #22c55e' : 'none',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}>
              <strong>{guess.participantName}</strong>: {guess.text}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
