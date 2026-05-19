import { Card } from "./Card";

interface ScoreboardRow {
  participantId: string;
  name: string;
  score: number;
  isDrawer: boolean;
  isWinner: boolean;
  isViewer: boolean;
}

interface ScoreboardProps {
  rows: ScoreboardRow[];
  isResult?: boolean;
}

export function Scoreboard({ rows, isResult = false }: ScoreboardProps) {
  return (
    <Card title={isResult ? "Final Scores" : "Scoreboard"}>
      {rows.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <ul className="player-list">
          {rows.map((row) => (
            <li key={row.participantId}>
              <span>
                {row.name}
                {row.isViewer ? " (you)" : ""}
                {row.isDrawer ? " · drawer" : ""}
                {row.isWinner ? (isResult ? " · winner" : " · leading") : ""}
              </span>
              <strong>{row.score}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
