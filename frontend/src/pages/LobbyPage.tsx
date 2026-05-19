import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, error, isHydrating, isLoading, isPolling, canStart, disabledReason } = useRoomState();

  useEffect(() => {
    if (!isHydrating && !room) {
      navigate("/", { replace: true });
    }
  }, [isHydrating, navigate, room]);

  useEffect(() => {
    if (room?.status === "playing") {
      navigate("/game");
    }
  }, [navigate, room?.status]);

  useEffect(() => {
    if (!room || room.status !== "lobby") {
      roomStore.stopLobbyPolling();
      return;
    }

    if (document.visibilityState === "visible") {
      roomStore.startLobbyPolling();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void roomStore.fetchRoom({
          background: true,
          suppressThrow: true
        });
        roomStore.startLobbyPolling();
        return;
      }

      roomStore.stopLobbyPolling();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      roomStore.stopLobbyPolling();
    };
  }, [room?.code, room?.status, roomStore]);

  async function handleRefresh() {
    try {
      await roomStore.fetchRoom();
    } catch (_caughtError) {
      // Request errors are already surfaced by the room store state.
    }
  }

  async function handleStart() {
    try {
      await roomStore.startRoom();
    } catch (_caughtError) {
      // Request errors are already surfaced by the room store state.
    }
  }

  if (!room) {
    return null;
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
                    {participant.role === "host" ? "host" : "joined"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className="status-line" style={{ backgroundColor: isLoading || isPolling ? '#fef3c7' : '#e0e7ff', color: isLoading || isPolling ? '#b45309' : '#3730a3' }}>
            {room.status === "playing" ? "Game starting..." : isLoading || isPolling ? "Refreshing players..." : "Ready to play"}
          </p>
          <p style={{ marginTop: '8px' }}>
            {error ?? disabledReason ?? "Waiting for the host to start the game."}
          </p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        <button className="button button--primary" disabled={isLoading || isPolling || !canStart} onClick={handleStart}>
          {isLoading ? "Starting..." : "Start Game"}
        </button>
      </div>
    </section>
  );
}
