import { Card } from "./Card";
import type { Participant } from "../services/api";

interface ScoreboardProps {
  participants: Participant[];
}

export function Scoreboard({ participants }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      {participants.length === 0 ? (
        <p>No players yet.</p>
      ) : (
        <ul className="player-list">
          {participants.map((p) => (
            <li key={p.id}>
              <span>{p.name}</span>
              <strong>{p.score}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
