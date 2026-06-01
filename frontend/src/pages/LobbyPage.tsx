import { useEffect, useMemo, useState } from "react";
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
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const isHost = useMemo(
    () =>
      room?.participants.some(
        (participant) => participant.isHost && participant.id === participantId,
      ),
    [room, participantId],
  );

  const canStart = !!room && isHost && room.participants.length >= 2;

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "active") {
      navigate("/game", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room) {
      return undefined;
    }

    let isMounted = true;

    async function refresh() {
      try {
        await roomStore.fetchRoom();
        if (isMounted) {
          setLastUpdatedAt(new Date().toLocaleTimeString());
        }
      } catch {
        // errors are handled by store state
      }
    }

    refresh();
    const interval = window.setInterval(refresh, 2000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [room, roomStore]);

  async function handleRefresh() {
    try {
      setRefreshError(null);
      await roomStore.fetchRoom();
      setLastUpdatedAt(new Date().toLocaleTimeString());
    } catch (caughtError) {
      setRefreshError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to refresh room",
      );
    }
  }

  async function handleStart() {
    try {
      setRefreshError(null);
      await roomStore.startGame();
      navigate("/game");
    } catch (caughtError) {
      setRefreshError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to start game",
      );
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
                  <span>
                    {participant.name}
                    {participant.id === participantId ? " (you)" : ""}
                    {participant.isHost ? " • host" : ""}
                  </span>
                  <span className="player-list__meta">joined</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p
            className="status-line"
            style={{
              backgroundColor: isLoading ? "#fef3c7" : "#e0e7ff",
              color: isLoading ? "#b45309" : "#3730a3",
            }}
          >
            {isLoading ? "Refreshing players..." : "Ready to play"}
          </p>
          <p style={{ marginTop: "8px" }}>
            {error ??
              refreshError ??
              (isHost
                ? room.participants.length < 2
                  ? "You need at least 2 players before starting the game. Share the room code above to invite someone."
                  : "You can start the game once everyone is ready."
                : "Only the host can start the game. Please wait while they launch it.")}
          </p>
          {lastUpdatedAt ? (
            <p style={{ marginTop: "8px", fontSize: "0.9rem" }}>
              Last refreshed at {lastUpdatedAt}
            </p>
          ) : null}
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button
          className="button button--secondary"
          disabled={isLoading}
          onClick={handleRefresh}
        >
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        <button
          className="button button--primary"
          disabled={!canStart || isLoading}
          onClick={handleStart}
        >
          Start Game
        </button>
      </div>
    </section>
  );
}
