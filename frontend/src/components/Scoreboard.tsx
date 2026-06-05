import { Card } from "./Card";
import type { ParticipantScore } from "../services/api";

interface ScoreboardProps {
  scores?: ParticipantScore[];
}

export function Scoreboard({ scores = [] }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
        {scores.length === 0 ? (
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        ) : (
          scores.map((score) => (
            <div className="placeholder-row" key={score.participantId}>
              <span>{score.participantName}</span>
              <strong>{score.score}</strong>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
