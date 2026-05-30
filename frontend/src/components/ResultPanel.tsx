import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function ResultPanel() {
  const { room } = useRoomState();
  const guesses = room?.guesses ?? [];

  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Game activity and guesses will appear here.</p>
        </div>
      ) : (
        <ul className="player-list">
          {guesses.map((g, index) => (
            <li key={index}>
              <span>
                {g.participantName}: {g.text}
              </span>
              <span style={{ color: g.correct ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                {g.correct ? "✓" : "✗"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
