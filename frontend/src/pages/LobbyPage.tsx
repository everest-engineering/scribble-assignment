import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, error, isLoading } = useRoomState();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doPoll = useCallback(async () => {
    try {
      const snapshot = await roomStore.fetchRoom();
      if (snapshot && snapshot.status === "playing") {
        navigate("/game");
      }
    } catch {
      // polling errors are non-fatal
    }
  }, [roomStore, navigate]);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "playing") {
      navigate("/game", { replace: true });
      return;
    }

    if (room.status === "finished") {
      navigate("/game", { replace: true });
      return;
    }

    pollingRef.current = setInterval(doPoll, 2000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [navigate, room, doPoll]);

  async function handleStart() {
    try {
      await roomStore.startGame();
      navigate("/game");
    } catch {
      // error is set on store
    }
  }

  if (!room) {
    return null;
  }

  const isHost = room.hostId === roomStore.getSnapshot().participantId;
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
                    {participant.id === room.hostId ? <span className="host-badge"> (Host)</span> : null}
                  </span>
                  <span className="player-list__meta">joined</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className="status-line" style={{ backgroundColor: isLoading ? '#fef3c7' : '#e0e7ff', color: isLoading ? '#b45309' : '#3730a3' }}>
            {isLoading ? "Refreshing players..." : `${room.participants.length} player${room.participants.length !== 1 ? "s" : ""} in lobby`}
          </p>
          <p style={{ marginTop: '8px' }}>{error ?? "Waiting for the host to start the game."}</p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={doPoll}>
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        {isHost ? (
          <button className="button button--primary" disabled={!canStart || isLoading} onClick={handleStart}>
            {!canStart ? "Need at least 2 players" : "Start Game"}
          </button>
        ) : null}
      </div>
    </section>
  );
}
