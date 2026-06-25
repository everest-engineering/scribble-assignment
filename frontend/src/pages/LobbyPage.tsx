import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomPolling } from "../hooks/useRoomPolling";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, error, isLoading } = useRoomState();
  const [actionError, setActionError] = useState<string | null>(null);

  useRoomPolling(2000, Boolean(room && room.status === "lobby"));

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "playing" || room.status === "result") {
      navigate("/game", { replace: true });
    }
  }, [navigate, room]);

  async function handleStartGame() {
    try {
      setActionError(null);
      await roomStore.startGame();
      navigate("/game");
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
    }
  }

  if (!room) {
    return null;
  }

  const canStart = room.isHost && room.participants.length >= 2;

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
                    {participant.id === room.hostId ? (
                      <span className="player-list__badge">Host</span>
                    ) : null}
                  </span>
                  <span className="player-list__meta">joined</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className="status-line status-line--lobby">
            {isLoading ? "Refreshing players..." : "Ready to play"}
          </p>
          <p style={{ marginTop: "8px" }}>
            {error ?? actionError ?? (room.isHost ? "You are the host." : "Waiting for the host to start the game.")}
          </p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        {room.isHost ? (
          <button
            className="button button--primary"
            disabled={!canStart || isLoading}
            onClick={handleStartGame}
          >
            {canStart ? "Start Game" : "Need 2+ players to start"}
          </button>
        ) : (
          <p className="lobby-waiting">Waiting for the host to start the game...</p>
        )}
      </div>
    </section>
  );
}
