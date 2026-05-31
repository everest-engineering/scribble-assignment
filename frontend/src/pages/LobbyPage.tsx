import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

const LOBBY_POLL_INTERVAL_MS = 2000;

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  const isHost = Boolean(room && participantId && room.hostId === participantId);
  const canStart = isHost && room?.status === "lobby" && (room?.participants.length ?? 0) >= 2;

  const goToGameIfPlaying = useCallback(
    (status: string | undefined) => {
      if (status === "playing") {
        navigate("/game", { replace: true });
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    goToGameIfPlaying(room?.status);
  }, [goToGameIfPlaying, room?.status]);

  useEffect(() => {
    if (!room || room.status !== "lobby") {
      return;
    }

    const intervalId = window.setInterval(() => {
      void roomStore.fetchRoom().then((snapshot) => {
        if (snapshot) {
          goToGameIfPlaying(snapshot.status);
        }
      });
    }, LOBBY_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [goToGameIfPlaying, room, room?.code, room?.status, roomStore]);

  async function handleRefresh() {
    try {
      setRefreshError(null);
      const snapshot = await roomStore.fetchRoom();
      if (snapshot) {
        goToGameIfPlaying(snapshot.status);
      }
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
    }
  }

  async function handleStartGame() {
    if (!isHost) {
      return;
    }

    if ((room?.participants.length ?? 0) < 2) {
      setStartError("At least two players are required to start the game.");
      return;
    }

    try {
      setStartError(null);
      const snapshot = await roomStore.startGame();
      goToGameIfPlaying(snapshot.status);
    } catch (caughtError) {
      setStartError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
    }
  }

  if (!room) {
    return null;
  }

  const statusMessage =
    startError ??
    refreshError ??
    error ??
    (isHost && (room.participants.length ?? 0) < 2
      ? "Waiting for at least one more player to start."
      : "Waiting for the host to start the game.");

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
                    {participant.id === room.hostId ? " (Host)" : ""}
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
              color: isLoading ? "#b45309" : "#3730a3"
            }}
          >
            {isLoading ? "Refreshing players..." : room.status === "lobby" ? "Ready to play" : "Game started"}
          </p>
          <p style={{ marginTop: "8px" }}>{statusMessage}</p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        {isHost ? (
          <button
            className="button button--primary"
            disabled={isLoading || !canStart}
            onClick={handleStartGame}
          >
            Start Game
          </button>
        ) : null}
      </div>
    </section>
  );
}
