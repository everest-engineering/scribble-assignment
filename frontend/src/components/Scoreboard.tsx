import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  participants: Participant[];
  currentDrawerId?: string;
}

export function Scoreboard({ participants, currentDrawerId }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      {participants.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <div className="scoreboard-list">
          {participants.map((p) => (
            <div key={p.id} className="scoreboard-row">
              <span>
                {p.name}
                {p.isHost && <span className="player-list__badge">Host</span>}
                {p.id === currentDrawerId && <span className="player-list__badge">Drawer</span>}
              </span>
              <strong>0</strong>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
