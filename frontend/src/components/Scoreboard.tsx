import { Card } from "./Card";
import type { ScoreEntry } from "../services/api";

interface ScoreboardProps {
  scores: ScoreEntry[];
  drawerId: string | null;
}

export function Scoreboard({ scores, drawerId }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      {scores.length === 0 ? (
        <p>No scores yet.</p>
      ) : (
        <ol className="score-list">
          {scores.map((score) => (
            <li key={score.participantId}>
              <span>
                {score.playerName}
                {drawerId === score.participantId ? <em>Drawer</em> : null}
              </span>
              <strong>{score.score}</strong>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
