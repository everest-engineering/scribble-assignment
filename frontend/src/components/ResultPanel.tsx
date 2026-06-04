import { useRoomState, useRoomStore } from "../state/roomStore";
import { Card } from "./Card";

export function ResultPanel() {
  const { room, participantId, isLoading } = useRoomState();
  const roomStore = useRoomStore();

  if (!room) return null;

  const isHost = room.hostId === participantId;

  async function handleRestart() {
    try {
      await roomStore.restartGame();
    } catch (e) {
      console.error("Restart failed", e);
    }
  }

  async function handleNextRound() {
    try {
      await roomStore.nextRound();
    } catch (e) {
      console.error("Next round failed", e);
    }
  }

  return (
    <div className="result-panel">
      <Card title="Final Results">
        <p>
          The word was: <strong>{room.secretWord}</strong>
        </p>
        <ul className="player-list" style={{ marginTop: "16px" }}>
          {room.participants.map((participant) => (
            <li key={participant.id}>
              <span>{participant.name}</span>
              <strong>{room.scores[participant.id] || 0} pts</strong>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Guess History">
        <ul className="player-list">
          {room.guesses.map((guess, index) => (
            <li
              key={index}
              style={{
                borderLeft: guess.isCorrect ? "4px solid #10b981" : "4px solid #ef4444",
                paddingLeft: "8px"
              }}
            >
              <strong>{guess.playerName}:</strong> {guess.text}
            </li>
          ))}
        </ul>
      </Card>

      {isHost && (
        <div className="button-row" style={{ marginTop: "16px" }}>
          <button
            className="button button--primary"
            disabled={isLoading}
            onClick={handleNextRound}
          >
            {isLoading ? "Starting..." : "Next Round"}
          </button>
          <button
            className="button button--secondary"
            disabled={isLoading}
            onClick={handleRestart}
          >
            {isLoading ? "Restarting..." : "Back to Lobby"}
          </button>
        </div>
      )}
    </div>
  );
}
