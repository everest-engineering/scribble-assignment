import { Card } from "./Card";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function ResultPanel() {
  const { room, participantId } = useRoomState();
  const store = useRoomStore();

  const viewerIsHost = room && participantId && room.hostId === participantId;

  const onRestart = async () => {
    try {
      await store.restartRoom();
    } catch (e) {
      // ignore for now
    }
  };

  return (
    <Card title="Activity">
      {room?.status === "results" ? (
        <div>
          <div style={{ marginBottom: 12 }}>
            <strong>Round Results</strong>
          </div>

          {room.round?.secretWord ? (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '0.95rem', color: '#374151' }}>Secret word:</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{room.round.secretWord}</div>
            </div>
          ) : null}

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: '0.9rem', color: '#374151', marginBottom: 6 }}>Scores</div>
            <ul className="score-list">
              {room.participants.map((p) => (
                <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{p.name} {p.id === room.hostId ? '(host)' : ''}</span>
                  <strong>{p.score ?? 0}</strong>
                </li>
              ))}
            </ul>
          </div>

          {viewerIsHost ? (
            <div className="button-row">
              <button className="button button--primary" onClick={onRestart}>Restart Round</button>
            </div>
          ) : null}
        </div>
      ) : room?.guesses && room.guesses.length > 0 ? (
        <ul className="activity-list">
          {room.guesses.map((g) => (
            <li key={g.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: g.correct ? 700 : 500 }}>{g.text}</span>
                <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{new Date(g.createdAt).toLocaleTimeString()}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{g.correct ? 'Correct' : 'Guess'}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Game activity and guesses will appear here.</p>
        </div>
      )}
    </Card>
  );
}
