import { Card } from "./Card";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function ResultPanel() {
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading } = useRoomState();

  if (!room) {
    return null;
  }

  const isHost = participantId === room.hostId;
  const finished = room.gameState === "finished";
  const correctWord = room.currentRound?.result?.correctWord ?? room.currentRound?.secretWord;
  const finalScore = room.currentRound?.totalScore ?? 0;
  const guesses = room.currentRound?.guessHistory ?? [];

  async function handleRestart() {
    try {
      await roomStore.restartRoom();
    } catch {
      // Error is surfaced by the store state.
    }
  }

  return (
    <Card title="Result">
      {finished ? (
        <div className="result-panel">
          <p className="result-copy">The round has finished.</p>
          <dl className="result-summary">
            <div>
              <dt>Correct word</dt>
              <dd>{correctWord ?? "Unknown"}</dd>
            </div>
            <div>
              <dt>Total score</dt>
              <dd>{finalScore}</dd>
            </div>
          </dl>

          <div className="result-history">
            <h3>Guess history</h3>
            {guesses.length ? (
              <ul className="guess-history-list">
                {guesses.map((guess) => (
                  <li key={guess.id} className="guess-history-item">
                    <span>
                      <strong>{guess.participantName}</strong>: {guess.text}
                    </span>
                    <span className={guess.correct ? "guess-status guess-status--correct" : "guess-status"}>
                      {guess.correct ? `Correct +${guess.score}` : "Incorrect +0"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="result-copy">No guesses were submitted.</p>
            )}
          </div>

          {error ? <p className="form__error">{error}</p> : null}

          {isHost ? (
            <button className="button button--primary" disabled={isLoading} onClick={handleRestart}>
              {isLoading ? "Restarting..." : "Restart Round"}
            </button>
          ) : (
            <p className="result-copy">Waiting for the host to restart the game.</p>
          )}
        </div>
      ) : (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Game activity and guesses will appear here.</p>
        </div>
      )}
    </Card>
  );
}
