import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL_MS = 2000;

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, error, isLoading, participantId } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  // Automatic lobby polling (~2s). A failed poll is non-fatal: keep the last
  // known roster on screen and show a subtle note instead of clearing state or
  // redirecting (spec FR-011).
  useEffect(() => {
    if (!room) {
      return;
    }

    const interval = setInterval(() => {
      roomStore.fetchRoom().then(
        () => setRefreshError(null),
        () => setRefreshError("Couldn't reach the room — retrying…")
      );
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [room, roomStore]);

  // Once the game has started, send every participant to the game screen. The
  // host transitions on its own start call; guessers transition when polling
  // reports the playing status.
  useEffect(() => {
    if (room?.status === "playing") {
      navigate("/game");
    }
  }, [navigate, room?.status]);

  async function handleRefresh() {
    try {
      setRefreshError(null);
      await roomStore.fetchRoom();
    } catch {
      setRefreshError("Couldn't reach the room — retrying…");
    }
  }

  async function handleStart() {
    try {
      setRefreshError(null);
      await roomStore.startGame();
      navigate("/game");
    } catch (caughtError) {
      setRefreshError(
        caughtError instanceof Error ? caughtError.message : "Unable to start the game"
      );
    }
  }

  if (!room) {
    return null;
  }

  const isHost = room.hostId === participantId;
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
          <p className="status-line" style={{ backgroundColor: isLoading ? '#fef3c7' : '#e0e7ff', color: isLoading ? '#b45309' : '#3730a3' }}>
            {isLoading ? "Refreshing players..." : "Ready to play"}
          </p>
          <p style={{ marginTop: '8px' }}>{error ?? refreshError ?? "Waiting for the host to start the game."}</p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        {isHost ? (
          <button
            className="button button--primary"
            disabled={!canStart || isLoading}
            onClick={handleStart}
          >
            {canStart ? "Start Game" : "Start Game (need 2+ players)"}
          </button>
        ) : (
          <p className="lobby-waiting">Waiting for host to start…</p>
        )}
      </div>
    </section>
  );
}
