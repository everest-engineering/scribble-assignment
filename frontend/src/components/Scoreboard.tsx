import { type Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  participants: Participant[];
  scores: Record<string, number>;
}

export function Scoreboard({ participants, scores }: ScoreboardProps) {
  const ranked = [...participants].sort(
    (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0)
  );

  return (
    <Card title="Scoreboard">
      <ul className="scoreboard">
        {ranked.map((participant) => (
          <li key={participant.id} className="scoreboard__row">
            <span className="scoreboard__name">{participant.name}</span>
            <strong className="scoreboard__score">{scores[participant.id] ?? 0}</strong>
          </li>
        ))}
        {ranked.length === 0 ? (
          <li className="scoreboard__row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </li>
        ) : null}
      </ul>
    </Card>
  );
}
