import { Card } from "./Card";
import type { Participant } from "../services/api";

interface ScoreboardProps {
  participants: Participant[];
  scores: Record<string, number>;
}

export function Scoreboard({ participants, scores }: ScoreboardProps) {
  const sorted = [...participants].sort(
    (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0),
  );

  return (
    <Card title="Scoreboard">
      {sorted.map((participant) => (
        <div key={participant.id} className="scoreboard__row">
          <span className="scoreboard__name">{participant.name}</span>
          <strong className="scoreboard__score">
            {scores[participant.id] ?? 0}
          </strong>
        </div>
      ))}
    </Card>
  );
}
