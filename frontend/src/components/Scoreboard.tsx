import { Card } from "./Card";
import type { ScoreEntry } from "../services/api";

interface ScoreboardProps {
  scores: ScoreEntry[];
}

export function Scoreboard({ scores }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
        {scores.length === 0 ? (
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        ) : (
          scores.map((entry) => (
            <div className="placeholder-row" key={entry.participantId}>
              <span>{entry.playerName}</span>
              <strong>{entry.score}</strong>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
