import { Card } from "./Card";
import type { Participant } from "../services/api";

interface ScoreboardProps {
  participants: Participant[];
  scores: Record<string, number>;
  drawerId: string;
}

export function Scoreboard({ participants, scores, drawerId }: ScoreboardProps) {
  const ranked = [...participants].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));

  return (
    <Card title="Scoreboard">
      {ranked.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <ul className="player-list scoreboard-list">
          {ranked.map((participant, index) => (
            <li key={participant.id} className="scoreboard-row">
              <span className="scoreboard-rank">#{index + 1}</span>
              <span className="scoreboard-name">
                {participant.name}
                {participant.id === drawerId ? <span className="host-badge"> Drawing</span> : null}
              </span>
              <strong className="scoreboard-score">{scores[participant.id] ?? 0}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
