import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function ResultPanel() {
  const { room } = useRoomState();
  const guesses = room ? [...room.guesses].reverse() : [];

  return (
    <Card title="Activity">
      <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
        {guesses.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Game activity and guesses will appear here.</p>
        ) : (
          guesses.map((guess) => (
            <div className="placeholder-row" key={guess.id} style={{ alignItems: 'flex-start', gap: '4px' }}>
              <span style={{ fontSize: '0.875rem' }}>
                <strong>{guess.participantName}</strong>: {guess.text}
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: guess.isCorrect ? '#16a34a' : '#dc2626',
                whiteSpace: 'nowrap'
              }}>
                {guess.isCorrect ? '✓ correct' : '✗ wrong'}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
