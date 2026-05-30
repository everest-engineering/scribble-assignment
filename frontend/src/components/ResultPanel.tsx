import { useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function ResultPanel() {
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [restartError, setRestartError] = useState<string | null>(null);

  if (!room) {
    return null;
  }

  const currentParticipant = room.participants.find(
    (participant) => participant.id === participantId,
  );

  const isHost = currentParticipant?.isHost ?? false;

  async function handleRestart() {
    try {
      setRestartError(null);
      await roomStore.restartGame();
    } catch (caughtError) {
      setRestartError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to restart game",
      );
    }
  }

  return (
    <div>
      {room.currentWord && (
        <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "#f3f4f6", borderRadius: "4px" }}>
          <h3 style={{ marginBottom: "8px" }}>The Word</h3>
          <p style={{ fontSize: "18px", fontWeight: "bold", color: "#1f2937" }}>
            {room.currentWord}
          </p>
        </div>
      )}

      <h3 style={{ marginBottom: "12px" }}>Guess History</h3>

      {room.guesses.length === 0 ? (
        <p>No guesses yet.</p>
      ) : (
        <ul className="player-list">
          {room.guesses.map((guess) => (
            <li key={guess.id}>
              <span>
                {guess.playerName}: {guess.message}
              </span>

              <span>
                {guess.isCorrect ? "✅" : "❌"}
              </span>
            </li>
          ))}
        </ul>
      )}

      {isHost && room.status === "playing" && (
        <div style={{ marginTop: "16px" }}>
          <button 
            className="button button--primary" 
            onClick={handleRestart}
            style={{ width: "100%" }}
          >
            Restart Game
          </button>
          {restartError && (
            <p style={{ color: "#dc2626", marginTop: "8px" }}>
              {restartError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}