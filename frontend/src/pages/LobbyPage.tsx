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
  const [startError, setStartError] = useState<string | null>(null);
  const hasNavigated = useRef(false);

  const viewerIsHost = room?.participants.some((p) => p.id === participantId && p.isHost) ?? false;
  const canStart = viewerIsHost && (room?.participants.length ?? 0) >= 2;

  const drawerName =
    room?.participants.find((p) => p.id === room?.round?.drawerPlayerId)?.name ?? null;

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    roomStore.startPolling();
    return () => {
      roomStore.stopPolling();
    };
  }, [navigate, room, roomStore]);

  useEffect(() => {
    if (room?.status === "playing" && !hasNavigated.current) {
      hasNavigated.current = true;
      navigate("/game");
    }
  }, [navigate, room?.status]);

  const handleStart = useCallback(async () => {
    try {
      setStartError(null);
      const result = await roomStore.startGame();
      if (result) {
        navigate("/game");
      }
    } catch (caughtError) {
      setStartError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
    }
  }, [navigate, roomStore]);

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
                    {participant.isHost ? <span className="player-list__host-badge"> Host</span> : null}
                    {participant.id === room.round?.drawerPlayerId ? <span className="player-list__drawer-badge"> Drawer</span> : null}
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
          <p style={{ marginTop: '8px' }}>
            {error ?? startError ?? drawerName ? `Drawer: ${drawerName}` : "Waiting for the host to start the game."}
          </p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        {viewerIsHost ? (
          <button
            className="button button--primary"
            disabled={!canStart || isLoading}
            onClick={handleStart}
          >
            {isLoading ? "Starting..." : canStart ? "Start Game" : "Need at least 2 players"}
          </button>
        ) : (
          <p className="start-restricted">Only the host can start the game.</p>
        )}
      </div>
    </section>
  );
}
