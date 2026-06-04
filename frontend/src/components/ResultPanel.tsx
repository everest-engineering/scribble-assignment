import { useState } from "react";
import { Card } from "./Card";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function ResultPanel() {
  const roomStore = useRoomStore();
  const { room, participantId, hostParticipantId, isLoading } = useRoomState();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const guessHistory = room?.guessHistory ?? [];
  const isResult = room?.status === "result";
  const isHost = Boolean(room && participantId && participantId === hostParticipantId);

  async function handleRestart() {
    if (!room) {
      return;
    }

    try {
      setStatusMessage(null);
      await roomStore.restartRoom(room.code);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to restart room");
    }
  }

  return (
    <Card title={isResult ? "Round Result" : "Activity"} badge={guessHistory.length > 0 ? `${guessHistory.length} guesses` : "Live feed"}>
      {isResult && room?.currentWord ? (
        <div className="result-panel__summary">
          <p className="result-panel__word">
            Secret word: <strong>{room.currentWord}</strong>
          </p>
          <ul className="player-list">
            {room.participants.map((participant) => (
              <li key={participant.id} className="player-list__item">
                <span className="player-list__name">{participant.name}</span>
                <span className="player-list__score">{participant.score} pts</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {guessHistory.length === 0 ? (
        <div className="placeholder-block">
          <p>{isResult ? "No guesses were recorded this round." : "Server-accepted guesses will appear here in order."}</p>
        </div>
      ) : (
        <ul className="activity-feed">
          {guessHistory.map((entry, index) => (
            <li
              key={`${entry.participantId}-${entry.guess}-${index}`}
              className={`activity-feed__item${entry.isCorrect ? " activity-feed__item--correct" : ""}`}
            >
              <div className="activity-feed__row">
                <span className="activity-feed__name">{entry.participantName}</span>
                <span className={`activity-feed__tag${entry.isCorrect ? " activity-feed__tag--correct" : ""}`}>
                  {entry.isCorrect ? "correct" : "guess"}
                </span>
              </div>
              <p className="activity-feed__guess">{entry.guess}</p>
            </li>
          ))}
        </ul>
      )}

      {isResult && isHost ? (
        <div className="button-row button-row--compact">
          <button className="button button--primary" disabled={isLoading} onClick={handleRestart} type="button">
            {isLoading ? "Restarting..." : "Restart / Play Again"}
          </button>
        </div>
      ) : null}

      {statusMessage ? <p className="form__status">{statusMessage}</p> : null}
    </Card>
  );
}
