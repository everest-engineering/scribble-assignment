import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, error, isLoading, participantId } = useRoomState();
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  // Redirect to game when room becomes active
  useEffect(() => {
    if (room?.status === "active") {
      navigate("/game", { replace: true });
    }
  }, [navigate, room?.status]);

  // Polling setup: fetch room updates every 2000ms
  useEffect(() => {
    if (!room) return;

    const intervalId = setInterval(async () => {
      try {
        await roomStore.fetchRoom();
      } catch (caughtError) {
        console.error("Lobby polling error:", caughtError);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [room, roomStore]);

  async function handleStartGame() {
    try {
      setStartError(null);
      await roomStore.startGame();
    } catch (caughtError) {
      setStartError(caughtError instanceof Error ? caughtError.message : "Failed to start game");
    }
  }

  async function handleRefresh() {
    try {
      setStartError(null);
      await roomStore.fetchRoom();
    } catch (caughtError) {
      setStartError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
    }
  }

  if (!room) {
    return null;
  }

  const currentParticipant = room.participants.find((p) => p.id === participantId);
  const isHost = currentParticipant?.isHost === true;
  const canStart = room.participants.length >= 2;

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <PageHeader
          kicker="Waiting for players"
          title="Lobby"
          description="Share the room code with friends so they can join your game."
        />
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="summary-grid">
        <Card title="Participants">
          {room.participants.length === 0 ? (
            <p>No participants are connected to this room yet.</p>
          ) : (
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>
                    {participant.name}
                    {participant.isHost ? (
                      <strong style={{ marginLeft: "8px", fontSize: "0.8em", color: "#3730a3" }}>(Host)</strong>
                    ) : null}
                  </span>
                  <span className="player-list__meta">joined</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className="status-line" style={{ backgroundColor: isLoading ? '#fef3c7' : '#e0e7ff', color: isLoading ? '#b45309' : '#3730a3' }}>
            {isLoading ? "Refreshing players..." : "Ready to play"}
          </p>
          {(error ?? startError) ? (
            <p style={{ marginTop: '8px', color: '#dc2626' }}>{error ?? startError}</p>
          ) : (
            <p style={{ marginTop: '8px' }}>Waiting for the host to start the game.</p>
          )}
          {isHost && !canStart && (
            <p style={{ marginTop: '4px', fontSize: '0.85em', color: '#6b7280' }}>
              At least 2 players are needed to start.
            </p>
          )}
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        {isHost ? (
          <button
            id="start-game-btn"
            className="button button--primary"
            disabled={!canStart || isLoading}
            onClick={handleStartGame}
          >
            Start Game
          </button>
        ) : null}
      </div>
    </section>
  );
}
