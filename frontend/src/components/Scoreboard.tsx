import { Card } from "./Card";
import type { Scoreboard as ScoreboardData } from "../../../backend/src/models/game";

interface ScoreboardProps {
  scoreboard: ScoreboardData;
  participants: { id: string; name: string }[];
}

export function Scoreboard({ scoreboard = {}, participants = [] }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      <div className="scoreboard">
        {participants?.map(p => (
          <div key={p.id} className="scoreboard-row">
            <span>{p.name}</span>
            <strong>{scoreboard[p.id] || 0}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
}
