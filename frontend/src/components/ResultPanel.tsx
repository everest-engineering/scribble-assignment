import { Card } from "./Card";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function ResultPanel() {
  const { room, participantId, isLoading } = useRoomState();
  const roomStore = useRoomStore();

  if (!room) {
    return null;
  }

  const isHost = room.hostId === participantId;

  return (
    <Card title="Activity">
      <div style={{ maxHeight: 200, overflow: 'auto' }}>
        {room.guesses && room.guesses.length > 0 ? (
          <ul className="activity-list">
            {room.guesses.map((g) => (
              <li key={g.id}>
                <strong>{room.participants.find((p) => p.id === g.participantId)?.name ?? 'Unknown'}</strong>: {g.text}
                <span style={{ float: 'right', color: '#6b7280' }}>{new Date(g.createdAt).toLocaleTimeString()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No activity yet.</p>
        )}
      </div>

      {isHost ? (
        <div className="button-row" style={{ marginTop: 12 }}>
          <button
            className="button button--secondary"
            disabled={isLoading}
            onClick={async () => {
              try {
                await roomStore.restartGame();
              } catch (err) {
                // ignore, store will set error state
              }
            }}
          >
            {isLoading ? 'Restarting...' : 'Restart Game'}
          </button>
        </div>
      ) : null}
    </Card>
  );
}
