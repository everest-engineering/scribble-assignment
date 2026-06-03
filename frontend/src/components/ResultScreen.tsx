import { useNavigate } from "react-router-dom";
import { Card } from "./Card";
import { useRoomState, useRoomStore } from "../state/roomStore";
import { GuessHistory } from "./GuessHistory";
import { Scoreboard } from "./Scoreboard";
import { useState } from "react";

export function ResultScreen() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [isRestarting, setIsRestarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!room) return null;

  const isHost = room.hostId === participantId;

  const handleRestart = async () => {
    try {
      setIsRestarting(true);
      setError(null);
      await roomStore.restartGame();
      // Polling will take care of navigating back to lobby
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restart game");
      setIsRestarting(false);
    }
  };

  return (
    <div className="game-page__layout">
      <aside className="game-page__sidebar game-page__sidebar--left">
        <Scoreboard />
      </aside>

      <div className="game-page__main">
        <Card title="Round Over!">
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>The word was:</h2>
            <strong style={{ fontSize: "3rem", letterSpacing: "0.1em", color: "var(--color-primary-600)" }}>
              {room.secretWord ?? "Unknown"}
            </strong>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "2rem" }}>
            {error && <p style={{ color: "var(--color-danger-500)", marginBottom: "1rem" }}>{error}</p>}
            {isHost ? (
              <button 
                className="button button--primary" 
                onClick={handleRestart}
                disabled={isRestarting}
              >
                {isRestarting ? "Restarting..." : "Restart Game"}
              </button>
            ) : (
              <p className="status-message">Waiting for host to restart the game...</p>
            )}
          </div>
        </Card>
      </div>

      <aside className="game-page__sidebar game-page__sidebar--right">
        <GuessHistory />
      </aside>
    </div>
  );
}
