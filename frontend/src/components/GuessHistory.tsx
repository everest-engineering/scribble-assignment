import type { Guess, Participant } from "../services/api";

interface GuessHistoryProps {
  guesses: Guess[];
  participants: Participant[];
  scores: Record<string, number>;
}

export function GuessHistory({ guesses, participants, scores }: GuessHistoryProps) {
  const participantName = (id: string) => participants.find((p) => p.id === id)?.name ?? id;

  const sortedScores = Object.entries(scores)
    .sort(([, a], [, b]) => b - a);

  return (
    <div>
      {sortedScores.length > 0 && (
        <div className="card">
          <div className="card__header">
            <h2>Scores</h2>
          </div>
          <div className="card__body">
            <ul className="player-list">
              {sortedScores.map(([participantId, score]) => (
                <li key={participantId}>
                  <span>{participantName(participantId)}</span>
                  <span className="player-list__meta">{score} pts</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {guesses.length > 0 && (
        <div className="card">
          <div className="card__header">
            <h2>Guess History</h2>
          </div>
          <div className="card__body">
            <ul className="guess-history">
              {guesses.map((guess, index) => (
                <li key={index} className={`guess-entry guess-entry--${guess.result}`}>
                  <span className="guess-entry__name">{participantName(guess.participantId)}</span>
                  <span className="guess-entry__text">"{guess.text}"</span>
                  <span className="guess-entry__result">
                    {guess.result === "correct" ? "✓ Correct" : "✗ Incorrect"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
