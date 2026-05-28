import { Card } from "./Card";
import type { Participant } from "../services/api";

interface ScoreboardProps {
  participants: Participant[];
  scores: Record<string, number>;
}

export function Scoreboard({ participants, scores }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      <ul className="score-list">
        {participants.map((participant) => (
          <li key={participant.id}>
            <span>{participant.name}</span>
            <strong>{scores[participant.id] ?? 0}</strong>
          </li>
        ))}
      </ul>
    </Card>
  );
}
