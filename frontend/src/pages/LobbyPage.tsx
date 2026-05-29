import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  // Automatic 2-second polling
  useEffect(() => {
    if (!room) return;

    const intervalId = setInterval(() => {
      roomStore.fetchRoom().catch(() => {
        // error surfaces through store state
      });
    }, 2000);

    return () => clearInterval(intervalId);
  }, [room?.code, roomStore]);

  // Navigate to game when room becomes active
  useEffect(() => {
    if (room?.status === "active") {
      navigate("/game", { replace: true });
    }
  }, [room?.status, navigate]);

  if (!room) {
    return null;
  }

  const isHost = participantId === room.hostId;
  const canStart = room.participants.length >= 2;

  async function handleStartGame() {
    try {
      setStartError(null);
      await roomStore.startGame();
    } catch (caughtError) {
      setStartError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
    }
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
                  {participant.id === room.hostId ? (
                    <span className="player-list__meta">host</span>
                  ) : (
                    <span className="player-list__meta">joined</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          {error ? (
            <p className="form__error">Connection issue — retrying…</p>
          ) : (
            <p className="status-line" style={{ backgroundColor: isLoading ? "#fef3c7" : "#e0e7ff", color: isLoading ? "#b45309" : "#3730a3" }}>
              {isLoading ? "Refreshing players..." : "Waiting for host to start"}
            </p>
          )}
          {startError ? <p className="form__error" style={{ marginTop: "8px" }}>{startError}</p> : null}
          {isHost && !canStart ? (
            <p style={{ marginTop: "8px", fontSize: "0.875rem", color: "#6b7280" }}>
              Waiting for more players…
            </p>
          ) : null}
        </Card>
      </div>

      {isHost ? (
        <div className="button-row button-row--spread">
          <button
            className="button button--primary"
            disabled={!canStart || isLoading}
            onClick={handleStartGame}
          >
            Start Game
          </button>
        </div>
      ) : null}
    </section>
  );
}
