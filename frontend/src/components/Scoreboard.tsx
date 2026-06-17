import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  participants: Participant[];
}

export function Scoreboard({ participants }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      {participants.length === 0 ? (
        <p>Waiting for players...</p>
      ) : (
        <div className="placeholder-block">
          {participants.map((p) => (
            <div key={p.id} className="placeholder-row">
              <span>{p.name}</span>
              <strong>{p.score}</strong>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
