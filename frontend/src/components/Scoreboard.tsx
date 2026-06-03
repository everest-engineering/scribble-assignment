import { Card } from "./Card";

interface ScoreboardProps {
  playerScores: { playerId: string; score: number; name: string }[];
}

export function Scoreboard({ playerScores }: ScoreboardProps) {
  if (playerScores.length === 0) {
    return (
      <Card title="Scoreboard">
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      </Card>
    );
  }

  const sorted = [...playerScores].sort((a, b) => b.score - a.score);

  return (
    <Card title="Scoreboard">
      <ul className="scoreboard-list">
        {sorted.map((entry) => (
          <li key={entry.playerId} className="scoreboard-row">
            <span>{entry.name}</span>
            <strong>{entry.score}</strong>
          </li>
        ))}
      </ul>
    </Card>
  );
}
