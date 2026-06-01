import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, pollError, isLoading, isPolling } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.gameState === "inProgress") {
      navigate("/game", { replace: true });
      return;
    }

    roomStore.startPolling();
    return () => {
      roomStore.stopPolling();
    };
  }, [navigate, room, roomStore]);

  async function handleRefresh() {
    try {
      setRefreshError(null);
      await roomStore.fetchRoom();
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
    }
  }

  async function handleStart() {
    if (!room) {
      return;
    }

    if (room.participants.length < 2) {
      setStartError("At least 2 players are required to start the game.");
      return;
    }

    try {
      setStartError(null);
      await roomStore.startGame();
      navigate("/game");
    } catch (caughtError) {
      setStartError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
    }
  }

  if (!room) {
    return null;
  }

  const isHost = Boolean(
    participantId && room.participants.some((participant) => participant.id === participantId && participant.isHost)
  );
  const canStart = room.participants.length >= 2;

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
                    {participant.isHost ? "Host" : "joined"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p
            className="status-line"
            style={{
              backgroundColor: isLoading || isPolling ? "#fef3c7" : "#e0e7ff",
              color: isLoading || isPolling ? "#b45309" : "#3730a3"
            }}
          >
            {isLoading ? "Refreshing players..." : isPolling ? "Polling room state..." : "Ready to play"}
          </p>
          <p style={{ marginTop: "8px" }}>
            {error ?? pollError ?? refreshError ?? "Waiting for the host to start the game."}
          </p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        {isHost ? (
          <button className="button button--primary" disabled={!canStart} onClick={handleStart}>
            Start Game
          </button>
        ) : (
          <button className="button button--primary button--disabled" type="button" disabled>
            Host only
          </button>
        )}
      </div>
      {startError ? <p className="form__error">{startError}</p> : null}
    </section>
  );
}
