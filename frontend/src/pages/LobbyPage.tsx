import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isHost = room !== null && participantId !== null && room.hostId === participantId;

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    pollingRef.current = setInterval(() => {
      roomStore.fetchRoom().catch((caughtError) => {
        setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
      });
    }, 2000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [navigate, room, roomStore]);

  async function handleStart() {
    try {
      setStartError(null);
      const updatedRoom = await roomStore.startGame();
      if (updatedRoom) {
        navigate("/game");
      }
    } catch (caughtError) {
      setStartError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
    }
  }

  if (!room) {
    return null;
  }

  const canStart = isHost && room.participants.length >= 2;

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
                    {room.hostId === participant.id ? (
                      <span className="host-badge"> Host</span>
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
            {isLoading ? "Refreshing players..." : `${room.participants.length} player${room.participants.length !== 1 ? 's' : ''} connected`}
          </p>
          <p style={{ marginTop: '8px' }}>
            {error ?? refreshError ?? startError ??
              (isHost
                ? room.participants.length < 2
                  ? "Waiting for at least one more player to join before you can start."
                  : "You are the host. Start the game when everyone is ready."
                : "Waiting for the host to start the game.")}
          </p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        {isHost ? (
          <button className="button button--primary" disabled={!canStart || isLoading} onClick={handleStart}>
            {isLoading ? "Starting..." : "Start Game"}
          </button>
        ) : (
          <p className="waiting-message">The host will start the game shortly...</p>
        )}
        <button className="button button--secondary" onClick={() => navigate("/")}>
          Leave Room
        </button>
      </div>
    </section>
  );
}
