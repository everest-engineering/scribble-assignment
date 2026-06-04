import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading } = useRoomState();
  const [actionError, setActionError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isHost = room !== null && participantId !== null && room.hostId === participantId;
  const canStart = room !== null && room.participants.length >= 2 && isHost;

  const doPoll = useCallback(async () => {
    try {
      const updatedRoom = await roomStore.fetchRoom();
      if (updatedRoom && updatedRoom.status === "playing") {
        navigate("/game", { replace: true });
      }
    } catch {
      // polling error swallowed; next tick will retry
    }
  }, [roomStore, navigate]);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    pollingRef.current = setInterval(doPoll, 2000);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [room, navigate, doPoll]);

  async function handleStartGame() {
    try {
      setActionError(null);
      await roomStore.startGame();
      navigate("/game", { replace: true });
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
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
                  <span>
                    {participant.name}
                    {participant.id === room?.hostId ? (
                      <span style={{ marginLeft: "8px", fontSize: "0.75rem", color: "#2563eb", fontWeight: 600 }}>
                        (Host)
                      </span>
                    ) : null}
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
              backgroundColor: isLoading ? '#fef3c7' : '#e0e7ff',
              color: isLoading ? '#b45309' : '#3730a3'
            }}
          >
            {isLoading ? "Refreshing players..." : `${room.participants.length} player(s) connected`}
          </p>
          <p style={{ marginTop: '8px' }}>
            {actionError ?? error ?? (
              isHost
                ? room.participants.length < 2
                  ? "Share the room code with friends. At least 2 players are needed to start."
                  : "You can start the game when everyone is ready."
                : "Waiting for the host to start the game."
            )}
          </p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={doPoll}>
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        <button
          className="button button--primary"
          disabled={!canStart || isLoading}
          onClick={handleStartGame}
          title={
            !isHost
              ? "Only the host can start the game"
              : room.participants.length < 2
                ? "At least 2 players are required"
                : "Start the game"
          }
        >
          {isHost
            ? room.participants.length < 2
              ? "Waiting for players..."
              : "Start Game"
            : "Waiting for host..."}
        </button>
      </div>
    </section>
  );
}
