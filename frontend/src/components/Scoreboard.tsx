import { Card } from "./Card";
import type { ScoreView } from "../services/api";

interface ScoreboardProps {
  scores?: ScoreView[];
}

export function Scoreboard({ scores = [] }: ScoreboardProps) {
  const ranked = [...scores].sort((a, b) => b.score - a.score);

  return (
    <Card title="Scoreboard">
      <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
        {ranked.length === 0 ? (
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        ) : (
          ranked.map((entry) => (
            <div className="placeholder-row" key={entry.participantId}>
              <span>{entry.name}</span>
              <strong>{entry.score}</strong>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
