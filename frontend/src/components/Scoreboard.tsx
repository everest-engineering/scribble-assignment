import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  participants?: Participant[];
  scores?: Record<string, number>;
}

export function Scoreboard({ participants, scores }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      {!participants || participants.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <ul className="player-list">
          {participants.map((p) => (
            <li key={p.id}>
              <span>{p.name}</span>
              <strong>{scores?.[p.id] ?? 0}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
