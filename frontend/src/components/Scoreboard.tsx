import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  participants: Participant[];
  drawerId: string | null;
}

export function Scoreboard({ participants, drawerId }: ScoreboardProps) {
  const ranked = [...participants].sort((a, b) => b.score - a.score);

  return (
    <Card title="Scoreboard">
      <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
        {ranked.length === 0 ? (
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        ) : (
          ranked.map((participant) => (
            <div className="placeholder-row" key={participant.id}>
              <span>
                {participant.name}
                {participant.id === drawerId ? " (drawer)" : ""}
              </span>
              <strong>{participant.score}</strong>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
