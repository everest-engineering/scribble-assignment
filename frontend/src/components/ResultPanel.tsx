import { useRoomState } from "../state/roomStore";
import { Card } from "./Card";

export function ResultPanel() {
  const { room } = useRoomState();

  if (!room || room.status !== "result") {
    return (
      <Card title="Activity">
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Game activity and guesses will appear here.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Result">
      <p style={{ fontWeight: 600, marginBottom: '8px' }}>
        The word was: <strong>{room.secretWord ?? "—"}</strong>
      </p>

      <h4 style={{ margin: '12px 0 4px' }}>Scores</h4>
      <ul className="player-list">
        {room.participants.map((p) => (
          <li key={p.id}>
            <span>{p.name}</span>
            <strong>{room.scores[p.id] ?? 0} pts</strong>
          </li>
        ))}
      </ul>

      {room.guesses.length > 0 && (
        <>
          <h4 style={{ margin: '12px 0 4px' }}>Guess History</h4>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.875rem' }}>
            {room.guesses.map((g) => (
              <li key={g.id} style={{ color: g.correct ? '#16a34a' : '#6b7280', marginBottom: '4px' }}>
                <strong>{g.playerName}</strong>: {g.text} {g.correct ? "✓" : "✗"}
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
