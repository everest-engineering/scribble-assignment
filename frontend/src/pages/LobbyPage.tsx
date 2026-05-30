import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (room?.status === "playing" || room?.status === "results") {
      navigate("/game", { replace: true });
    }
  }, [navigate, room?.status]);

  useEffect(() => {
    if (!room || room.status !== "lobby") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void roomStore
        .fetchRoom()
        .then(() => {
          setRefreshError(null);
        })
        .catch((caughtError) => {
          setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
        });
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [room?.code, room?.status, roomStore]);

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
      setStartError(null);
      await roomStore.startGame();
    } catch (caughtError) {
      setStartError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
    }
  }

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const startMessage = room.viewerIsHost
    ? room.canStartGame
      ? "You can start the round as soon as everyone is ready."
      : `You need at least ${room.minimumPlayersToStart} players to start the round.`
    : "Only the host can start the round.";
  const statusMessage = startError ?? error ?? refreshError ?? startMessage;

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
                    {participant.id === room.hostParticipantId
                      ? participant.id === participantId
                        ? "you · host"
                        : "host"
                      : participant.id === participantId
                        ? "you"
                        : "joined"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className={`status-line ${isLoading ? "status-line--loading" : "status-line--info"}`}>
            {isLoading ? "Updating room..." : room.viewerIsHost ? "Host controls enabled" : "Waiting for host"}
          </p>
          <p style={{ marginTop: "8px" }}>{statusMessage}</p>
          {viewer ? (
            <p className="placeholder-note">
              Signed in as {viewer.name}{room.viewerIsHost ? " (host)" : ""}
            </p>
          ) : null}
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        <button
          className="button button--primary"
          disabled={!room.canStartGame || isLoading}
          onClick={handleStartGame}
        >
          {room.viewerIsHost ? "Start Round" : "Host Can Start"}
        </button>
      </div>
    </section>
  );
}
