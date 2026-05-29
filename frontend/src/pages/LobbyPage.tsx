import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, error, isLoading } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  async function handleRefresh() {
    try {
      setRefreshError(null);
      await roomStore.fetchRoom();
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
    }
  }

  useEffect(() => {
    if (!room || room.status !== "lobby") {
      return undefined;
    }

    let isActive = true;
    const refreshLobby = async () => {
      try {
        await roomStore.fetchRoom();
        if (isActive) {
          setRefreshError(null);
        }
      } catch (caughtError) {
        if (isActive) {
          setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
        }
      }
    };

    const intervalId = window.setInterval(() => {
      void refreshLobby();
    }, 2000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [room?.code, room?.status, roomStore]);

  async function handleStartGame() {
    try {
      setRefreshError(null);
      const nextRoom = await roomStore.startGame();

      if (nextRoom.status === "playing") {
        navigate("/game");
      }
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
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
                    {participant.id === room.hostParticipantId ? "Host" : "Joined"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className={`status-line ${room.canStart ? "status-line--ready" : "status-line--waiting"}`}>
            {isLoading ? "Working..." : room.canStart ? "Ready to start" : "Waiting for players"}
          </p>
          <p className="lobby-status__message">
            {error ??
              refreshError ??
              (room.isHost
                ? room.canStart
                  ? "You can start the game now."
                  : "At least 2 players are required to start."
                : "Waiting for the host to start the game.")}
          </p>
          <p className="lobby-status__polling">Lobby refreshes automatically every 2 seconds.</p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        <button className="button button--primary" disabled={!room.isHost || !room.canStart || isLoading} onClick={handleStartGame}>
          {room.isHost ? "Start Game" : "Host Starts Game"}
        </button>
      </div>
    </section>
  );
}
