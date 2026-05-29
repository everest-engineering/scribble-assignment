import { Card } from "./Card";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function ResultPanel() {
  const roomStore = useRoomStore();
  const { room, error, isLoading } = useRoomState();
  const resultRound = room?.status === "result" ? room.completedRound : undefined;
  const guesses = resultRound?.guesses ?? room?.currentRound?.guesses ?? [];

  async function handleRestart() {
    try {
      await roomStore.restartRoom();
    } catch {
      // Store error state renders below.
    }
  }

  return (
    <Card title={resultRound ? "Round Result" : "Activity"}>
      {resultRound ? (
        <div className="result-summary">
          <span className="result-summary__label">Correct word</span>
          <strong>{resultRound.secretWord}</strong>
          <p>
            Final result from {resultRound.drawerName}'s drawing. Scores and guesses below are locked for this completed round.
          </p>
        </div>
      ) : null}

      {guesses.length === 0 ? (
        <p>{resultRound ? "No guesses were submitted this round." : "Game activity and guesses will appear here."}</p>
      ) : (
        <ul className="guess-history">
          {guesses.map((guess) => (
            <li key={guess.id} className={guess.isCorrect ? "guess-history__item guess-history__item--correct" : "guess-history__item"}>
              <div>
                <strong>{guess.participantName}</strong>
                <span>{guess.text}</span>
              </div>
              <span className="guess-history__result">{guess.isCorrect ? `Correct +${guess.pointsAwarded}` : "+0"}</span>
            </li>
          ))}
        </ul>
      )}

      {resultRound ? (
        <div className="result-actions">
          {room?.isHost ? (
            <button className="button button--primary" type="button" disabled={isLoading} onClick={() => void handleRestart()}>
              {isLoading ? "Restarting..." : "Restart to Lobby"}
            </button>
          ) : (
            <p className="result-actions__waiting">Waiting for the host to restart the game.</p>
          )}
          {error ? <p className="form__error">{error}</p> : null}
        </div>
      ) : null}
    </Card>
  );
}
