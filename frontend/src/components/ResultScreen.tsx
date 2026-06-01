import { Canvas } from "./Canvas";
import { Card } from "./Card";
import { useRoomState, useRoomStore } from "../state/roomStore";
import "./ResultScreen.css";

export function ResultScreen() {
  const { room, participantId } = useRoomState();
  const store = useRoomStore();

  if (!room) return null;

  const isHost = room.roles.find((_, i) => room.participants[i].id === participantId) === "host" || room.participants[0].id === participantId;

  // Derive the target word.
  // In the 'results' phase, the secretWord should be exposed to all if it exists.
  const targetWord = room.currentRound?.secretWord || "Unknown Word";

  // Sort players by score
  const sortedPlayers = [...room.participants].sort((a, b) => {
    const scoreA = room.scores[a.id] || 0;
    const scoreB = room.scores[b.id] || 0;
    return scoreB - scoreA; // Descending
  });

  const handleReturnToLobby = () => {
    store.resetRoom();
  };

  return (
    <div className="result-screen">
      <Card title="Round Over!">
        <div className="result-header">
          <h2>The word was: <span className="target-word">{targetWord}</span></h2>
        </div>

        <div className="result-content">
          <div className="result-scores">
            <h3>Final Scores</h3>
            <ul className="score-list">
              {sortedPlayers.map((player, index) => (
                <li key={player.id} className="score-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{player.name}</span>
                  <span className="points">{room.scores[player.id] || 0} pts</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="result-canvas-container">
            <h3>Final Drawing</h3>
            <div className="canvas-wrapper">
              <Canvas strokes={room.strokes} isDrawer={false} width={800} height={600} />
            </div>
          </div>
        </div>

        {isHost && (
          <div className="result-actions">
            <button className="primary-btn" onClick={handleReturnToLobby}>
              Return to Lobby
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
