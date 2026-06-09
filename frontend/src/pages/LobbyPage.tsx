import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, error, isLoading, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (room) {
      roomStore.startPolling(2000);
    }
    return () => {
      roomStore.stopPolling();
    };
  }, [room, roomStore]);

  useEffect(() => {
    if (room?.status === "playing") {
      navigate("/game");
    }
  }, [navigate, room?.status]);

  async function handleStartGame() {
    try {
      const response = await roomStore.startGame();
      if (response) {
        navigate("/game");
      }
    } catch {
      // Error is set in store state
    }
  }

  if (!room) {
    return null;
  }

  const isHost = participantId === room.hostId;
  const hasEnoughPlayers = room.participants.length >= 2;

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
                    {participant.id === room.hostId ? (
                      <span className="player-list__host"> (Host)</span>
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
            {isLoading ? "Starting game..." : "Ready to play"}
          </p>
          <p style={{ marginTop: '8px' }}>
            {error ?? (
              isHost && !hasEnoughPlayers
                ? "At least 2 players are required to start."
                : "Waiting for the host to start the game."
            )}
          </p>
        </Card>
      </div>

      <div className="button-row">
        {isHost ? (
          <button className="button button--primary" disabled={!hasEnoughPlayers || isLoading} onClick={handleStartGame}>
            {isLoading ? "Starting..." : "Start Game"}
          </button>
        ) : (
          <p className="host-notice">Waiting for the host to start the game...</p>
        )}
      </div>
    </section>
  );
}
