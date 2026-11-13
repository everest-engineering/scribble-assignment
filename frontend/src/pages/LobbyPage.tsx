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
  const [pollingError, setPollingError] = useState<boolean>(false);

  const roomCode = room?.code;

  useEffect(() => {
    if (!roomCode) {
      navigate("/", { replace: true });
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        await roomStore.fetchRoom();
        setPollingError(false);
      } catch (caughtError) {
        if (caughtError instanceof Error && caughtError.message.includes("Unable to load room")) {
          roomStore.clearSession();
          navigate("/", { replace: true });
        } else {
          setPollingError(true);
        }
      }
    }, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, [navigate, roomCode, roomStore]);

  useEffect(() => {
    if (room?.status === "game") {
      navigate("/game");
    }
  }, [navigate, room?.status]);

  const currentParticipant = room?.participants.find((p) => p.id === participantId);
  const isHost = currentParticipant?.isHost ?? false;

  async function handleStartGame() {
    try {
      setRefreshError(null);
      await roomStore.startGame();
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
    }
  }

  async function handleRefresh() {
    try {
      setRefreshError(null);
      await roomStore.fetchRoom();
      setPollingError(false);
    } catch (caughtError) {
      if (caughtError instanceof Error && caughtError.message.includes("Unable to load room")) {
        roomStore.clearSession();
        navigate("/", { replace: true });
      } else {
        setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
      }
    }
  }

  async function handleLeaveRoom() {
    try {
      setRefreshError(null);
      await roomStore.leaveRoom();
      navigate("/", { replace: true });
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to leave room");
    }
  }

  if (!room) {
    return null;
  }

  return (
    <section className="panel placeholder-page">
      {pollingError && (
        <div className="form__error" style={{ marginBottom: "24px" }}>
          Network connection lost. Trying to reconnect to server...
        </div>
      )}
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
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>{participant.name}</span>
                    {participant.isHost && (
                      <span className="card__badge" style={{ padding: "2px 8px", fontSize: "0.75rem", borderRadius: "4px" }}>
                        Host
                      </span>
                    )}
                  </div>
                  <span className="player-list__meta">joined</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className="status-line" style={{ backgroundColor: isLoading ? '#fef3c7' : '#e0e7ff', color: isLoading ? '#b45309' : '#3730a3' }}>
            {isLoading ? "Refreshing players..." : "Ready to play"}
          </p>
          <p style={{ marginTop: '8px' }}>
            {error ?? refreshError ?? (
              isHost
                ? (room.participants.length < 2 ? "Waiting for more players (at least 2 required to start)." : "Ready to start the game!")
                : "Waiting for the host to start the game."
            )}
          </p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={handleLeaveRoom}>
          Leave Room
        </button>
        <div style={{ display: "flex", gap: "16px" }}>
          <button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>
            {isLoading ? "Refreshing..." : "Refresh Room"}
          </button>
          {isHost && (
            <button
              className="button button--primary"
              disabled={isLoading || room.participants.length < 2}
              onClick={handleStartGame}
            >
              Start Game
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
