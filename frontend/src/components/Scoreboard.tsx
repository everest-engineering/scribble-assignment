import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  scores?: Record<string, number>;
  participants?: Participant[];
}

export function Scoreboard({ scores = {}, participants = [] }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      {participants.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <dl className="detail-list">
          {participants.map((participant) => (
            <div key={participant.id}>
              <dt>{participant.name}</dt>
              <dd>{scores[participant.name] ?? 0} pts</dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}
