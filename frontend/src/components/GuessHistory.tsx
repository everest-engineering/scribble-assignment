import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function GuessHistory() {
  const { room } = useRoomState();

  if (!room) return null;

  // Show in reverse chronological order (newest at bottom, but scrolled to bottom)
  return (
    <Card title="Guesses">
      <div 
        className="guess-history" 
        style={{ 
          height: '250px', 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column-reverse' 
        }}
      >
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {[...room.guesses].reverse().map((guess, index) => (
            <li 
              key={`${guess.timestamp}-${index}`}
              style={{ 
                padding: '0.5rem', 
                borderBottom: '1px solid #f3f4f6',
                color: guess.isCorrect ? '#059669' : '#374151',
                fontWeight: guess.isCorrect ? 'bold' : 'normal'
              }}
            >
              <strong>{guess.playerName}: </strong>
              <span>{guess.text}</span>
              {guess.isCorrect && <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>(Correct!)</span>}
            </li>
          ))}
          {room.guesses.length === 0 && (
            <p style={{ color: '#9ca3af', textAlign: 'center', margin: '1rem 0' }}>No guesses yet...</p>
          )}
        </ul>
      </div>
    </Card>
  );
}
