import { Card } from "./Card";
import type { GuessEntry, Participant } from "../services/api";

interface ResultsViewProps {
  secretWord: string;
  drawerName: string;
  participants: Participant[];
  scores: Record<string, number>;
  guessHistory: GuessEntry[];
}

export function ResultsView({ secretWord, drawerName, participants, scores, guessHistory }: ResultsViewProps) {
  const rankedScores = participants
    .map((p) => ({ name: p.name, score: scores[p.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  const participantMap = new Map(participants.map((p) => [p.id, p.name]));

  return (
    <div className="results-view">
      <Card title="Round Complete">
        <p className="results-view__word">
          The word was: <strong>{secretWord}</strong>
        </p>
        <p className="results-view__drawer">
          Drawer: {drawerName}
        </p>
      </Card>

      <Card title="Final Scores">
        <div className="scoreboard-list">
          {rankedScores.map((entry, index) => (
            <div key={entry.name} className="scoreboard-row">
              <span>
                {index === 0 && "🥇 "}
                {index === 1 && "🥈 "}
                {index === 2 && "🥉 "}
                {entry.name}
              </span>
              <strong>{entry.score}</strong>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Guess History">
        {guessHistory.length === 0 ? (
          <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No guesses were made this round.</p>
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
    </div>
  );
}
