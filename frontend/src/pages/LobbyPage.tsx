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
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room) {
      return;
    }

    pollingRef.current = setInterval(() => {
      roomStore.fetchRoom();
    }, 2000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [room, roomStore]);

  const viewer = room?.participants.find((p) => p.id === participantId);
  const isHost = viewer?.isHost ?? false;
  const canStart = isHost && (room?.participants.length ?? 0) >= 2;

  async function handleStart() {
    try {
      setStartError(null);
      await roomStore.startGame();
      navigate("/game");
    } catch (caughtError) {
      setStartError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
    }
  }

  function handleLeave() {
    roomStore.clearSession();
    navigate("/");
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
                  <span className="player-list__meta">
                    {participant.isHost ? "host" : "joined"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className="status-line" style={{ backgroundColor: isLoading ? '#fef3c7' : '#e0e7ff', color: isLoading ? '#b45309' : '#3730a3' }}>
            {isLoading ? "Refreshing players..." : "Ready to play"}
          </p>
          <p style={{ marginTop: '8px' }}>{error ?? startError ?? "Waiting for the host to start the game."}</p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" onClick={handleLeave}>
          Leave Room
        </button>
        <button
          className="button button--primary"
          disabled={!canStart || isLoading}
          onClick={handleStart}
        >
          {!isHost && room.participants.length < 2
            ? "Waiting for players..."
            : !isHost
              ? "Waiting for host..."
              : room.participants.length < 2
                ? "Need at least 2 players"
                : "Start Game"}
        </button>
      </div>
    </section>
  );
}
