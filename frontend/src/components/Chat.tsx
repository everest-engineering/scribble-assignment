import { useRoomState } from "../state/roomStore";
import { Card } from "./Card";

export function Chat() {
  const { room } = useRoomState();
  if (!room) return null;

  return (
    <Card title="Chat & Guesses">
      <div 
        style={{
          maxHeight: '200px', 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px',
          padding: '12px',
          background: 'var(--surface-strong)',
          borderRadius: '8px',
          border: '1px solid var(--line)'
        }}
      >
        {room.guesses.map((guess, idx) => {
          const participant = room.participants.find(p => p.id === guess.userId);
          const name = participant?.name || "Unknown";
          return (
            <div key={idx} style={{ color: guess.isCorrect ? 'var(--brand-strong)' : 'var(--ink)' }}>
              <strong>{name}:</strong> {guess.text}
            </div>
          );
        })}
        {room.guesses.length === 0 && (
          <div className="placeholder-note" style={{alignSelf: 'center'}}>No guesses yet.</div>
        )}
      </div>
    </Card>
  );
}
