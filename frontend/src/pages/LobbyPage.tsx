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
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [hasPollError, setHasPollError] = useState(false);
  const isHost = participantId !== null && room !== null && room.hostId === participantId;

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room) return;

    const interval = setInterval(async () => {
      try {
        const updatedRoom = await roomStore.fetchRoom();
        setHasPollError(false);

        if (updatedRoom && updatedRoom.status === "playing" && window.location.pathname !== "/game") {
          navigate("/game");
        }
      } catch {
        setHasPollError(true);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      setHasPollError(false);
    };
  }, [room, roomStore, navigate]);

  async function handleRefresh() {
    try {
      setRefreshError(null);
      await roomStore.fetchRoom();
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
    }
  }

  async function handleStartGame() {
    try {
      setRefreshError(null);
      await roomStore.startGame();
      navigate("/game");
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
    }
  }

  if (!room) {
    return null;
  }

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
                    {participant.id === room.hostId && (
                      <span className="player-list__host-badge">Host</span>
                    )}
                  </span>
                  <span className="player-list__meta">joined</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className="status-line" style={{ backgroundColor: isLoading ? '#fef3c7' : hasPollError ? '#fee2e2' : '#e0e7ff', color: isLoading ? '#b45309' : hasPollError ? '#991b1b' : '#3730a3' }}>
            {isLoading ? "Refreshing players..." : hasPollError ? "Connection issues" : "Ready to play"}
          </p>
          <p style={{ marginTop: '8px' }}>{error ?? refreshError ?? (hasPollError ? "Retrying..." : "Waiting for the host to start the game.")}</p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        {isHost && (
          <button className="button button--primary" disabled={!canStart || isLoading} onClick={handleStartGame}>
            {isLoading ? "Starting..." : canStart ? "Start Game" : "Need 2+ players"}
          </button>
        )}
      </div>
    </section>
  );
}
