import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL_MS = 2000;
const MIN_PLAYERS_TO_START = 2;

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
    if (room?.status === "started") {
      navigate("/game", { replace: true });
    }
  }, [navigate, room?.status]);

  useEffect(() => {
    if (!room) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      roomStore.fetchRoom().catch((caughtError) => {
        setRefreshError(
          caughtError instanceof Error ? caughtError.message : "Unable to refresh room"
        );
      });
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [room, roomStore]);

  if (!room) {
    return null;
  }

  const isHost = Boolean(participantId) && room.hostId === participantId;
  const hasEnoughPlayers = room.participants.length >= MIN_PLAYERS_TO_START;
  const canStart = isHost && hasEnoughPlayers && !isLoading;

  async function handleStart() {
    try {
      setStartError(null);
      await roomStore.startGame();
    } catch (caughtError) {
      setStartError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
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
                  <span>
                    {participant.name}
                    {participant.id === participantId ? " (you)" : ""}
                  </span>
                  <span className="player-list__meta">
                    {participant.isHost ? "host" : "joined"}
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
              backgroundColor: isLoading ? "#fef3c7" : "#e0e7ff",
              color: isLoading ? "#b45309" : "#3730a3"
            }}
          >
            {isLoading ? "Syncing players..." : "Ready to play"}
          </p>
          <p style={{ marginTop: "8px" }}>
            {isHost
              ? hasEnoughPlayers
                ? "You are the host. Start the game when everyone is ready."
                : "You are the host. At least 2 players are required to start."
              : "Waiting for the host to start the game."}
          </p>
          {(error || refreshError || startError) && (
            <p className="form__error" style={{ marginTop: "8px" }}>
              {startError ?? error ?? refreshError}
            </p>
          )}
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button
          className="button button--secondary"
          type="button"
          onClick={() => navigate("/", { replace: true })}
        >
          Leave Lobby
        </button>
        {isHost ? (
          <button
            className="button button--primary"
            type="button"
            disabled={!canStart}
            onClick={handleStart}
          >
            {isLoading ? "Starting..." : "Start Game"}
          </button>
        ) : null}
      </div>
    </section>
  );
}
