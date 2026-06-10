import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading, viewerIsHost: stateViewerIsHost } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  const viewerIsHost =
    !!room && (stateViewerIsHost || room.viewerIsHost || room.hostParticipantId === participantId);

  useEffect(() => {
    let mounted = true;

    async function restore() {
      if (room) {
        setIsRestoring(false);
        return;
      }

      await roomStore.restoreRoomSession();

      if (mounted) {
        setIsRestoring(false);
      }
    }

    restore();

    return () => {
      mounted = false;
    };
  }, [roomStore, room]);

  useEffect(() => {
    if (!room && !isRestoring) {
      navigate("/", { replace: true });
    }
  }, [navigate, room, isRestoring]);

  // Redirect to game if room is already playing/result
  useEffect(() => {
    if (room && (room.status === "playing" || room.status === "result")) {
      navigate("/game", { replace: true });
    }
  }, [navigate, room]);

  // Poll for room updates every 2 seconds while mounted
  useEffect(() => {
    // Don't start polling until the initial session restore has completed
    if (isRestoring) return;

    let mounted = true;

    async function poll() {
      if (!mounted) return;
      try {
        await roomStore.fetchRoom();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // If room not found, clear stored token and navigate back to start
        if (msg.includes("Room not found")) {
          roomStore.clearStoredParticipantForRoom(room?.code);
          navigate("/", { replace: true });
        } else {
          setRefreshError(msg);
        }
      }
    }

    const id = setInterval(poll, 2000);
    // run immediately once
    poll();

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [roomStore, navigate, isRestoring]);

  async function handleRefresh() {
    try {
      setRefreshError(null);
      await roomStore.fetchRoom();
    } catch (caughtError) {
      setRefreshError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to refresh room",
      );
    }
  }

  async function handleStartGame() {
    if (!viewerIsHost) {
      setRefreshError("Only the host may start the game");
      return;
    }

    if (!room || room.participants.length < 2) {
      setRefreshError("At least 2 players required to start");
      return;
    }

    try {
      await roomStore.startGame();
      navigate("/game");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start game";
      setRefreshError(msg);
    }
  }

  if (!room || isRestoring) {
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
                <li
                  key={participant.id}
                  className={
                    participant.id === room.hostParticipantId
                      ? "player--host"
                      : undefined
                  }
                >
                  <span>
                    {participant.name}
                    {participant.id === room.hostParticipantId ? " (host)" : ""}
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
              color: isLoading ? "#b45309" : "#3730a3",
            }}
          >
            {isLoading ? "Starting game..." : "Ready to play"}
          </p>
          <p style={{ marginTop: "8px" }}>
            {error ?? refreshError ?? "Waiting for the host to start the game."}
          </p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button
          className="button button--secondary"
          disabled={isLoading}
          onClick={handleRefresh}
        >
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        <button
          className="button button--primary"
          onClick={handleStartGame}
          disabled={!viewerIsHost || room.participants.length < 2 || isLoading}
        >
          {isLoading ? "Starting..." : "Start Game"}
        </button>
      </div>
    </section>
  );
}
