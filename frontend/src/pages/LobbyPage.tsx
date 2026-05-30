import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL_MS = 2000;

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, isLoading } = useRoomState();
  const navigatingRef = useRef(false);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room) return;

    const intervalId = setInterval(async () => {
      try {
        const updated = await roomStore.fetchRoom();
        if (updated?.status === "active" && !navigatingRef.current) {
          navigatingRef.current = true;
          navigate("/game", { replace: true });
        }
      } catch {
        // swallow poll errors — a briefly stale list is acceptable
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [navigate, room, roomStore]);

  if (!room) {
    return null;
  }

  const isHost = participantId === room.hostId;
  const canStart = room.participants.length >= 2;

  async function handleStartGame() {
    if (!room || !participantId) return;
    try {
      await roomStore.startRoom();
      navigate("/game", { replace: true });
    } catch {
      // error is reflected in roomStore state
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
                  <span className="player-list__meta">
                    {participant.id === room.hostId ? "host" : "joined"}
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
          {!canStart && isHost && (
            <p style={{ marginTop: '8px' }}>At least 2 players are needed to start.</p>
          )}
          {!isHost && (
            <p style={{ marginTop: '8px' }}>Waiting for the host to start the game.</p>
          )}
        </Card>
      </div>

      <div className="button-row button-row--spread">
        {isHost ? (
          <button
            className="button button--primary"
            onClick={handleStartGame}
            disabled={!canStart || isLoading}
          >
            Start Game
          </button>
        ) : (
          <p className="status-line" style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
            Waiting for host to start…
          </p>
        )}
      </div>
    </section>
  );
}
