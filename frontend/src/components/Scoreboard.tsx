import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  participants: Participant[];
}

export function Scoreboard({ participants }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      <div className="scoreboard">
        {participants.length === 0 ? (
          <p>Waiting for players...</p>
        ) : (
          <ul className="scoreboard__list">
            {participants.map((p) => (
              <li key={p.id} className="scoreboard__row">
                <span className="scoreboard__name">{p.name}</span>
                <strong className="scoreboard__score">{p.score}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
