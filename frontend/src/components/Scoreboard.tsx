import type { ScoreEntry } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  scores: ScoreEntry[];
}

export function Scoreboard({ scores }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      {scores.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <div className="score-list">
          {scores.map((entry) => (
            <div key={entry.participantId} className="score-row">
              <span className="score-row__name">{entry.participantName}</span>
              <strong className="score-row__value">{entry.score}</strong>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
