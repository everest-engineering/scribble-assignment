import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { api } from "../services/api";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, error, isLoading, participantId } = useRoomState();
  const [startError, setStartError] = useState<string | null>(null);
  const sessionRestoreAttempted = useRef(false);

  // Session restore: if no room in state, try to restore from sessionStorage
  useEffect(() => {
    if (room) return;

    if (sessionRestoreAttempted.current) {
      navigate("/", { replace: true });
      return;
    }

    sessionRestoreAttempted.current = true;
    roomStore
      .restoreSession()
      .then((restored) => {
        if (!restored) navigate("/", { replace: true });
      })
      .catch(() => navigate("/", { replace: true }));
  }, [room, navigate, roomStore]);

  // Navigate all players to game when room becomes active
  useEffect(() => {
    if (room?.status === "active") {
      navigate("/game");
    }
  }, [room?.status, navigate]);

  // Lobby polling: refresh participant list every ~2s
  useEffect(() => {
    if (!room) return;

    const intervalId = setInterval(() => {
      roomStore.fetchRoom().catch(() => {
        // Retain last known state on poll failure
      });
    }, 2000);

    return () => clearInterval(intervalId);
  }, [room?.code, roomStore]);

  const isHost = participantId !== null && room?.hostId === participantId;
  const canStart = isHost && (room?.participants.length ?? 0) >= 2;

  async function handleStartGame() {
    if (!canStart || !participantId || !room) return;
    try {
      setStartError(null);
      await api.startGame(room.code, participantId);
      navigate("/game");
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "Failed to start game");
    }
  }

  if (!room) {
    return null;
  }

  const statusMessage = isHost
    ? room.participants.length < 2
      ? "Waiting for more players…"
      : "Click Start Game when ready."
    : "Waiting for host to start…";

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
                    {participant.id === room.hostId ? " (host)" : ""}
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
            {isLoading ? "Refreshing players..." : "Ready to play"}
          </p>
          <p style={{ marginTop: "8px" }}>{statusMessage}</p>
          {(startError ?? error) ? (
            <p className="form__error">{startError ?? error}</p>
          ) : null}
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button
          className="button button--primary"
          disabled={!canStart}
          onClick={() => void handleStartGame()}
        >
          Start Game
        </button>
      </div>
    </section>
  );
}
