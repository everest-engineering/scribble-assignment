import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();
  if (!room) return null;

  const sortedParticipants = [...room.participants].sort((a, b) => {
    const scoreA = room.scores[a.id] || 0;
    const scoreB = room.scores[b.id] || 0;
    return scoreB - scoreA;
  });

  return (
    <div className="card">
      <header className="card__header">
        <h2>Players</h2>
      </header>
      <div className="card__body">
        <ul className="player-list">
          {sortedParticipants.map((p) => {
            const isDrawer = room.currentRound?.drawerId === p.id;
            return (
              <li key={p.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {p.name}
                  {isDrawer && <span className="status-line" style={{ padding: '4px 8px' }}>Drawer</span>}
                </div>
                <div className="player-list__meta">{room.scores[p.id] || 0} pts</div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
