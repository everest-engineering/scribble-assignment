import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  participants: Participant[];
}

export function Scoreboard({ participants }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      <ul className="scoreboard-list">
        {participants.map((p) => (
          <li key={p.id} className="scoreboard-row">
            <span className="scoreboard-name">
              {p.name}
              {p.role === "drawer" ? <span className="player-list__drawer"> (drawer)</span> : null}
            </span>
            <strong className="scoreboard-score">{p.score}</strong>
          </li>
        ))}
      </ul>
    </Card>
  );
}
