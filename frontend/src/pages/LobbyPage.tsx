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
  const [actionError, setActionError] = useState<string | null>(null);

  // Leave the lobby if there is no active room (initial load or closed room).
  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  // Poll the room ~every 2s so joins/leaves and the host's start are reflected. (FR-010)
  useEffect(() => {
    if (!room) {
      return;
    }

    const interval = window.setInterval(() => {
      roomStore.fetchRoom().catch(() => {
        // Errors are surfaced via store state; ignore here to keep polling.
      });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [roomStore, room?.code]);

  // When the host starts the game, every player's poll sees "playing". (FR-013)
  useEffect(() => {
    if (room?.status === "playing") {
      navigate("/game");
    }
  }, [navigate, room?.status]);

  if (!room) {
    return null;
  }

  const isHost = participantId === room.hostId;
  const canStart = isHost && room.participants.length >= MIN_PLAYERS_TO_START;

  async function handleStart() {
    try {
      setActionError(null);
      await roomStore.startGame();
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to start the game");
    }
  }

  async function handleRefresh() {
    try {
      setActionError(null);
      await roomStore.fetchRoom();
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
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
                    {participant.id === room.hostId ? "host" : "joined"}
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
            {isLoading ? "Refreshing players..." : "Ready to play"}
          </p>
          <p style={{ marginTop: "8px" }}>
            {error ??
              actionError ??
              (isHost
                ? room.participants.length < MIN_PLAYERS_TO_START
                  ? "Waiting for at least one more player to start."
                  : "You can start the game when everyone is ready."
                : "Waiting for the host to start the game.")}
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
        ) : null}
      </div>
    </section>
  );
}
