import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  participants: Participant[];
  scores: Record<string, number>;
}

export function Scoreboard({ participants, scores }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      <ul className="player-list">
        {participants.map((p) => (
          <li key={p.id}>
            <span>{p.name}</span>
            <strong>{scores[p.id] ?? 0}</strong>
          </li>
        ))}
      </ul>
    </Card>
  );
}
