import { RoomSnapshot } from "../services/api";
import { useRoomStore } from "../state/roomStore";

interface RoundEndedModalProps {
  room: RoomSnapshot;
}

export function RoundEndedModal({ room }: RoundEndedModalProps) {
  const store = useRoomStore();
  const { isHost } = room;

  const handleRestart = async () => {
    try {
      await store.restartGame();
    } catch (error) {
      console.error("Failed to restart:", error);
    }
  };

  return (
    <div className="panel modal">
      <h2>Round Ended</h2>
      <p>The secret word was: <strong>{room.currentWord}</strong></p>
      
      <h3>Scores</h3>
      <ul>
        {Object.entries(room.scoreboard).map(([id, score]) => {
          const participant = room.participants.find(p => p.id === id);
          return <li key={id}>{participant?.name}: {score}</li>;
        })}
      </ul>

      <h3>Guess History</h3>
      <div className="scrollable">
        {room.guessHistory.map((guess, index) => {
          const participant = room.participants.find(p => p.id === guess.playerId);
          return (
            <p key={index}>
              <strong>{participant?.name ?? "Unknown"}:</strong> {guess.text}
            </p>
          );
        })}
      </div>

      <div className="footer">
        {isHost ? (
          <button onClick={handleRestart} className="button button--secondary">Restart Game</button>
        ) : (
          <p>Waiting for host to restart...</p>
        )}
      </div>
    </div>
  );
}
