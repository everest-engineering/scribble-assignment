import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL = 2000;

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const isPollingRef = useRef(false);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isHost = room?.hostId != null && room.hostId === participantId;
  const playerCount = room?.participants.length ?? 0;
  const canStart = isHost && playerCount >= 2;

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    intervalIdRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [roomStore, navigate]);

  async function poll() {
    if (isPollingRef.current) return;

    const currentRoom = roomStore.getSnapshot().room;
    if (!currentRoom) return;

    isPollingRef.current = true;

    try {
      const snapshot = await roomStore.fetchRoom();
      if (!snapshot) {
        if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        navigate("/", { replace: true });
        return;
      }
      if (snapshot.status !== "lobby") {
        if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        navigate("/game");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const is404 = message.toLowerCase().includes("404") || message.toLowerCase().includes("not found");
      if (is404) {
        if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        navigate("/", { replace: true });
      }
    } finally {
      isPollingRef.current = false;
    }
  }

  async function handleRefresh() {
    try {
      setRefreshError(null);
      await roomStore.fetchRoom();
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = setInterval(poll, POLL_INTERVAL);
      }
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
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
                  {participant.isHost && <span className="player-list__badge">Host</span>}
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
        {isHost && (
          <button className="button button--primary" disabled={!canStart} onClick={() => navigate("/game")}>
            Start Game
          </button>
        )}
      </div>
      {isHost && !canStart && (
        <p className="status-line">Need at least 2 players to start.</p>
      )}
    </section>
  );
}
