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

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status !== "lobby") {
      navigate("/game", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room || room.status !== "lobby") {
      return undefined;
    }

    let isActive = true;
    let isPolling = false;

    const pollRoom = async () => {
      if (isPolling) {
        return;
      }

      try {
        isPolling = true;
        setRefreshError(null);
        const nextRoom = await roomStore.fetchRoom();

        if (isActive && nextRoom?.status !== "lobby") {
          navigate("/game", { replace: true });
        }
      } catch (caughtError) {
        if (isActive) {
          setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
        }
      } finally {
        isPolling = false;
      }
    };

    const intervalId = window.setInterval(() => {
      void pollRoom();
    }, 2000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [navigate, room?.code, room?.status, roomStore]);

  async function handleRefresh() {
    try {
      setRefreshError(null);
      await roomStore.fetchRoom();
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
    }
  }

  async function handleStartGame() {
    if (!participantId) {
      setRefreshError("Room session is missing");
      return;
    }

    try {
      setRefreshError(null);
      const nextRoom = await roomStore.startGame();

      if (nextRoom.status !== "lobby") {
        navigate("/game");
      }
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
    }
  }

  if (!room) {
    return null;
  }

  const canStartGame = room.isHost && room.participants.length >= 2;
  const startMessage = room.isHost
    ? room.participants.length >= 2
      ? "Ready for the host to start the game."
      : "At least 2 players are required to start."
    : "Waiting for the host to start the game.";

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
                    {participant.id === room.hostParticipantId ? "host" : "joined"}
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
          <p style={{ marginTop: '8px' }}>{error ?? refreshError ?? startMessage}</p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        {room.isHost ? (
          <button className="button button--primary" disabled={!canStartGame || isLoading} onClick={handleStartGame}>
            Start Game
          </button>
        ) : (
          <button className="button button--secondary" disabled type="button">
            Waiting for Host
          </button>
        )}
      </div>
    </section>
  );
}
