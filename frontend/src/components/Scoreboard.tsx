import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room, participantId } = useRoomState();

  const participants = room?.participants ?? [];

  const sorted = [...participants].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return (
    <Card title="Scoreboard">
      {sorted.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <ul className="scoreboard-list">
          {sorted.map((p) => (
            <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: p.id === participantId ? 700 : 500 }}>{p.name}</span>
                {p.id === room?.hostId ? <span style={{ marginLeft: 8, color: '#6b7280' }}> (host)</span> : null}
              </div>
              <strong>{p.score ?? 0}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
