import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, isLoading } = useRoomState();

  const isHost = room !== null && participantId !== null && room.hostId === participantId;
  const canStart = isHost && room !== null && room.participants.length >= 2;

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (room?.status === "active") {
      navigate("/game", { replace: true });
    }
  }, [room?.status, navigate]);

  useEffect(() => {
    if (!room?.code) return;

    const interval = setInterval(async () => {
      try {
        await roomStore.fetchRoom();
      } catch {
        // retain stale data; retry on next cycle
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [room?.code, roomStore]);

  async function handleStartGame() {
    try {
      await roomStore.startRoom();
      navigate("/game");
    } catch {
      // error surfaced via store state
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
                  <span>{participant.name}{participant.id === room.hostId ? " (host)" : ""}</span>
                  <span className="player-list__meta">joined</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className="status-line" style={{ backgroundColor: isLoading ? "#fef3c7" : "#e0e7ff", color: isLoading ? "#b45309" : "#3730a3" }}>
            {isLoading ? "Refreshing players..." : "Ready to play"}
          </p>
          {isHost ? (
            <p style={{ marginTop: "8px" }}>
              {canStart ? "Ready to start — click Start Game." : "Waiting for more players to join…"}
            </p>
          ) : (
            <p style={{ marginTop: "8px" }}>Waiting for the host to start the game.</p>
          )}
        </Card>
      </div>

      {isHost && (
        <div className="button-row button-row--spread">
          <button
            className="button button--primary"
            disabled={!canStart || isLoading}
            onClick={handleStartGame}
          >
            Start Game
          </button>
        </div>
      )}
    </section>
  );
}
