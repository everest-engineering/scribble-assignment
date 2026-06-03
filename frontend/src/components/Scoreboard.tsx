import type { ParticipantView } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  participants: ParticipantView[];
}

export function Scoreboard({ participants }: ScoreboardProps) {
  const ranked = [...participants].sort((a, b) => b.score - a.score);

  return (
    <Card title="Scoreboard">
      {ranked.length === 0 ? (
        <p>Waiting for players...</p>
      ) : (
        <ul className="player-list">
          {ranked.map((participant) => (
            <li key={participant.id}>
              <span>
                {participant.name}
                {participant.isDrawer ? <span className="player-list__meta"> drawer</span> : null}
              </span>
              <strong>{participant.score}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
