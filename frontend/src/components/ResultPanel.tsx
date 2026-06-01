import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function ResultPanel() {
  const { room } = useRoomState();

  if (!room || room.guesses.length === 0) {
    return (
      <Card title="Activity">
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Game activity and guesses will appear here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Activity">
      <ul className="activity-list">
        {room.guesses.map((guess, index) => (
          <li key={`${guess.participantId}-${index}`}>
            <span>
              <strong>{guess.participantName}:</strong> {guess.guess}
            </span>
            <span style={{ color: guess.correct ? '#15803d' : '#6b7280' }}>
              {guess.correct ? 'Correct' : 'Incorrect'}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
