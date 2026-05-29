import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, isLoading } = useRoomState();
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room) return;

    const interval = setInterval(async () => {
      try {
        const updated = await roomStore.fetchRoom();
        if (updated?.status === "playing") {
          navigate("/game");
        }
      } catch {
        // poll errors are non-fatal; retain last known state
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [room?.code]);

  async function handleStartGame() {
    try {
      setStartError(null);
      await roomStore.startRoom();
      navigate("/game");
    } catch (caughtError) {
      setStartError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
    }
  }

  if (!room) {
    return null;
  }

  const isHost = room.hostId === participantId;
  const canStart = isHost && room.participants.length >= 2;

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
          <p className="status-line" style={{ backgroundColor: isLoading ? "#fef3c7" : "#e0e7ff", color: isLoading ? "#b45309" : "#3730a3" }}>
            {isLoading ? "Refreshing..." : "Ready to play"}
          </p>
          {isHost ? (
            <p style={{ marginTop: "8px" }}>
              {room.participants.length < 2
                ? "Waiting for more players to join before you can start."
                : "You can start the game when ready."}
            </p>
          ) : (
            <p style={{ marginTop: "8px" }}>Waiting for host to start the game.</p>
          )}
          {startError ? <p className="form__error" style={{ marginTop: "8px" }}>{startError}</p> : null}
        </Card>
      </div>

      <div className="button-row button-row--spread">
        {isHost ? (
          <button
            className="button button--primary"
            disabled={!canStart || isLoading}
            onClick={handleStartGame}
          >
            {canStart ? "Start Game" : "Waiting for players..."}
          </button>
        ) : (
          <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Waiting for host to start the game.</p>
        )}
      </div>
    </section>
  );
}
