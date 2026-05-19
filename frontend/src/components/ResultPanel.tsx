import { Card } from "./Card";

interface GuessHistoryRow {
  id: string;
  playerName: string;
  text: string;
  isCorrect: boolean;
}

interface ResultPanelProps {
  historyRows: GuessHistoryRow[];
  winnerName?: string | null;
  isResult?: boolean;
}

export function ResultPanel({ historyRows, winnerName = null, isResult = false }: ResultPanelProps) {
  return (
    <Card title="Activity">
      {winnerName ? <p>{isResult ? `Winner: ${winnerName}` : `${winnerName} is leading`}</p> : null}
      {historyRows.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No guesses yet.</p>
        </div>
      ) : (
        <ul className="player-list">
          {historyRows.map((entry) => (
            <li key={entry.id}>
              <span>
                {entry.playerName}: {entry.text}
              </span>
              <span className="player-list__meta">{entry.isCorrect ? "correct" : "guess"}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
