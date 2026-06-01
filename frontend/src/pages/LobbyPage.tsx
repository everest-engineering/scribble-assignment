import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { usePolling, useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading } = useRoomState();
  const [startError, setStartError] = useState<string | null>(null);

  usePolling(true);

  if (!room) {
    return null;
  }

  const isHost = participantId === room.hostId;
  const canStart = room.participants.length >= 2;

  async function handleStart() {
    try {
      setStartError(null);
      await roomStore.startGame();
      navigate("/game");
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
          <p style={{ marginTop: '8px' }}>{error ?? startError ?? (isHost ? "" : "Waiting for the host to start the game.")}</p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        {isHost ? (
          <button className="button button--primary" disabled={!canStart || isLoading} onClick={handleStart}>
            {!canStart ? `Waiting for players... (${room.participants.length}/2)` : "Start Game"}
          </button>
        ) : (
          <p className="waiting-message">Waiting for the host to start the game...</p>
        )}
      </div>
    </section>
  );
}
