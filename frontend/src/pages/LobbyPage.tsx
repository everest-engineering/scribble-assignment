import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { usePolling, useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, error, isLoading, participantId } = useRoomState();

  usePolling(true);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (room && room.status === "playing") {
      navigate("/game", { replace: true });
    }
  }, [navigate, room]);

  if (!room) {
    return null;
  }

  const isHost = participantId === room.hostId;
  const canStart = isHost && room.participants.length >= 2 && room.status === "lobby";

  async function handleStartGame() {
    try {
      await roomStore.startGame();
    } catch {
    }
  }

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
                      <span className="host-badge"> HOST</span>
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
            {isLoading ? "Syncing..." : "Ready to play"}
          </p>
          <p style={{ marginTop: '8px' }}>{error ?? (isHost ? "You are the host. Start the game when at least 2 players have joined." : "Waiting for the host to start the game.")}</p>
          {room.participants.length < 2 ? (
            <p style={{ marginTop: '8px', color: '#991b1b' }}>At least 2 players are required to start.</p>
          ) : null}
        </Card>
      </div>

      <div className="button-row button-row--spread">
        {isHost ? (
          <button className="button button--primary" disabled={!canStart || isLoading} onClick={handleStartGame}>
            {isLoading ? "Starting..." : "Start Game"}
          </button>
        ) : (
          <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Waiting for host to start...</p>
        )}
      </div>
    </section>
  );
}
