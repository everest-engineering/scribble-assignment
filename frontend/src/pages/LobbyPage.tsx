import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { LOBBY_POLL_MS, useRoomPolling, useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, error, isLoading, participantId } = useRoomState();
  const [actionError, setActionError] = useState<string | null>(null);

  useRoomPolling(Boolean(room && room.status === "lobby"), LOBBY_POLL_MS);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "playing" || room.status === "result") {
      navigate("/game", { replace: true });
    }
  }, [navigate, room]);

  async function handleStart() {
    try {
      setActionError(null);
      await roomStore.startGame();
      navigate("/game");
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error ? caughtError.message : "Unable to start the game"
      );
    }
  }

  if (!room) {
    return null;
  }

  const startDisabled = !room.canStart || isLoading;
  const startHint = !room.isHost
    ? "Only the host can start the game."
    : room.participants.length < 2
      ? "Waiting for at least one more player..."
      : "You can start when everyone is ready.";

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
          <p
            className="status-line"
            style={{
              backgroundColor: isLoading ? "#fef3c7" : "#e0e7ff",
              color: isLoading ? "#b45309" : "#3730a3"
            }}
          >
            {isLoading ? "Syncing lobby..." : "Lobby updates every 2 seconds"}
          </p>
          <p style={{ marginTop: "8px" }}>{error ?? actionError ?? startHint}</p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <p className="form__hint">Players appear automatically — no manual refresh needed.</p>
        <button
          className="button button--primary"
          disabled={startDisabled}
          onClick={handleStart}
        >
          {room.isHost ? "Start Game" : "Waiting for Host"}
        </button>
      </div>
    </section>
  );
}
