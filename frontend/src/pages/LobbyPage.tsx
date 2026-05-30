import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (room?.status === "playing") {
      navigate("/game", { replace: true });
    }
  }, [room?.status, navigate]);

  useEffect(() => {
    if (!room) return;

    const interval = setInterval(() => {
      roomStore.fetchRoom().catch(() => {});
    }, 2000);

    return () => clearInterval(interval);
  }, [room?.code, roomStore]);

  if (!room) {
    return null;
  }

  const isHost = room.hostId === participantId;
  const canStart = room.participants.length >= 2;

  async function handleStart() {
    try {
      await roomStore.startGame();
      navigate("/game");
    } catch {
      // error is written to store state and shown in the Status card
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
                  <span>{participant.name}</span>
                  <span className="player-list__meta">
                    {participant.id === room.hostId ? "Host" : "joined"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className="status-line" style={{ backgroundColor: isLoading ? '#fef3c7' : '#e0e7ff', color: isLoading ? '#b45309' : '#3730a3' }}>
            {isLoading ? "Refreshing players..." : "Ready to play"}
          </p>
          <p style={{ marginTop: '8px' }}>{error ?? "Waiting for the host to start the game."}</p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        {isHost ? (
          <div>
            <button
              className="button button--primary"
              disabled={!canStart || isLoading}
              onClick={handleStart}
            >
              Start Game
            </button>
            {!canStart && (
              <p className="form__error">Need at least 2 players to start.</p>
            )}
          </div>
        ) : (
          <p>Waiting for the host to start the game...</p>
        )}
      </div>
    </section>
  );
}
