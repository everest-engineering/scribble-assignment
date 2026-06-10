import { Card } from "./Card";
import type { GuessEntry, Participant } from "../services/api";

interface ResultPanelProps {
  guessHistory: GuessEntry[];
  participants: Participant[];
}

export function ResultPanel({ guessHistory, participants }: ResultPanelProps) {
  const participantMap = new Map(participants.map((p) => [p.id, p.name]));

  return (
    <Card title="Activity">
      {guessHistory.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Game activity and guesses will appear here.</p>
        </div>
      ) : (
        <div className="activity-list">
          {guessHistory.map((entry) => (
            <div key={entry.id} className="activity-row">
              <span className="activity-row__name">{participantMap.get(entry.participantId) ?? "Unknown"}</span>
              <span className="activity-row__guess">{entry.text}</span>
              <span className={`activity-row__result ${entry.correct ? "activity-row__result--correct" : "activity-row__result--incorrect"}`}>
                {entry.correct ? "✓" : "✗"}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
