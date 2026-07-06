import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  participants: Participant[];
}

export function Scoreboard({ participants }: ScoreboardProps) {
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
              </span>
              <strong>0</strong>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
