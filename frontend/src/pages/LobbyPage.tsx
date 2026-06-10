import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL_MS = 2000;

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading } = useRoomState();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isHost = room?.participants.find((p) => p.id === participantId)?.isHost ?? false;
  const canStart = isHost && (room?.participants.length ?? 0) >= 2;

  const scheduleNextPoll = useCallback(() => {
    timeoutRef.current = setTimeout(async () => {
      const polled = await roomStore.pollRoom();
      if (polled !== null && polled.status === "playing") {
        navigate("/game");
        return;
      }
      scheduleNextPoll();
    }, POLL_INTERVAL_MS);
  }, [roomStore, navigate]);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    let cancelled = false;

    async function initialLoad() {
      await roomStore.fetchRoom();
      if (!cancelled) {
        scheduleNextPoll();
      }
    }

    void initialLoad();

    return () => {
      cancelled = true;
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

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
                    {participant.isHost ? " (Host)" : ""}
                  </span>
                  <span className="player-list__meta">joined</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className="status-line" style={{ backgroundColor: isLoading ? "#fef3c7" : "#e0e7ff", color: isLoading ? "#b45309" : "#3730a3" }}>
            {isLoading ? "Loading..." : "Ready to play"}
          </p>
          <p style={{ marginTop: "8px" }}>
            {error ?? "Waiting for the host to start the game."}
          </p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        {isHost ? (
          <button
            className="button button--primary"
            disabled={!canStart}
            onClick={async () => {
              await roomStore.startRoom();
              navigate("/game");
            }}
          >
            Start Game
          </button>
        ) : null}
      </div>
    </section>
  );
}
