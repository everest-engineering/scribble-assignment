import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function ResultPanel() {
  const { room } = useRoomState();

  return (
    <Card title="Guess History">
      {!room || room.guesses.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No guesses yet.</p>
        </div>
      ) : (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          {room.guesses.map((g, i) => (
            <div key={i} className="placeholder-row">
              <span>{g.participantName}</span>
              <span style={{ color: g.correct ? '#059669' : '#6b7280' }}>
                {g.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
