import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function ResultPanel() {
  const { room } = useRoomState();

  if (!room || room.status !== "result") {
    return (
      <Card title="Activity">
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Results will appear here when the round ends.
          </p>
        </div>
      </Card>
    );
  }

  const players = [...room.participants].sort((a, b) => b.score - a.score);

  return (
    <Card title="Round Result">
      <p>
        The word was <strong>{room.word ?? "—"}</strong>
      </p>

      <h4 style={{ marginBottom: '4px' }}>Final scores</h4>
      <ul className="player-list">
        {players.map((player) => (
          <li key={player.id}>
            <span>{player.name}</span>
            <strong>{player.score}</strong>
          </li>
        ))}
      </ul>

      <h4 style={{ marginBottom: '4px' }}>Guess history</h4>
      {room.guesses.length === 0 ? (
        <p>No guesses were made.</p>
      ) : (
        <ul className="player-list">
          {room.guesses.map((guess) => (
            <li key={guess.id}>
              <span>
                <strong>{guess.playerName}:</strong> {guess.text}
              </span>
              <span className="player-list__meta">{guess.correct ? "✅ +100" : "❌"}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
