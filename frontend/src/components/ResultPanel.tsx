import type { CompletedRoundSnapshot, Guess } from "../services/api";
import { Card } from "./Card";

interface ResultPanelProps {
  guesses: Guess[];
  completedRound?: CompletedRoundSnapshot | null;
  isHost?: boolean;
  isResult?: boolean;
  onRestart?: () => void;
  isRestarting?: boolean;
}

export function ResultPanel({ guesses, completedRound, isHost, isResult, onRestart, isRestarting }: ResultPanelProps) {
  if (isResult && completedRound) {
    return (
      <>
        <Card title="Secret Word Revealed">
          <p className="secret-word secret-word--revealed">{completedRound.secretWord}</p>
        </Card>

        <Card title="Final Scores">
          <div className="score-list">
            {completedRound.scores.map((entry) => (
              <div key={entry.participantId} className="score-row">
                <span className="score-row__name">{entry.participantName}</span>
                <strong className="score-row__value">{entry.score}</strong>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Guess History">
          {completedRound.guesses.length === 0 ? (
            <div className="placeholder-block">
              <p className="placeholder-text">No guesses were submitted this round.</p>
            </div>
          ) : (
            <div className="guess-list">
              {completedRound.guesses.map((guess) => (
                <div key={guess.id} className={`guess-row ${guess.isCorrect ? "guess-row--correct" : ""}`}>
                  <div className="guess-row__header">
                    <span className="guess-row__author">{guess.participantName}</span>
                    {guess.pointsAwarded > 0 ? (
                      <span className="guess-row__points">+{guess.pointsAwarded}</span>
                    ) : null}
                  </div>
                  <p className="guess-row__text">{guess.text}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {isHost ? (
          <div className="button-row">
            <button
              className="button button--primary"
              onClick={onRestart}
              disabled={isRestarting}
            >
              {isRestarting ? "Restarting..." : "Restart Game"}
            </button>
          </div>
        ) : (
          <Card title="Waiting for Host">
            <p className="instruction-text">The host can restart the game. Please wait...</p>
          </Card>
        )}
      </>
    );
  }

  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <div className="placeholder-block">
          <p className="placeholder-text">No guesses yet. Waiting for players to submit...</p>
        </div>
      ) : (
        <div className="guess-list">
          {guesses.map((guess) => (
            <div key={guess.id} className={`guess-row ${guess.isCorrect ? "guess-row--correct" : ""}`}>
              <div className="guess-row__header">
                <span className="guess-row__author">{guess.participantName}</span>
                {guess.pointsAwarded > 0 ? (
                  <span className="guess-row__points">+{guess.pointsAwarded}</span>
                ) : null}
              </div>
              <p className="guess-row__text">{guess.text}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
