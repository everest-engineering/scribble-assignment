import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore, useRoomPolling } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, error, isLoading, isHost } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useRoomPolling(2000);

  if (!room) {
    return (
      <section className="panel placeholder-page">
        <PageHeader kicker="Status" title="Lobby" description="Joining room..." />
        <button className="button button--secondary" onClick={() => navigate("/")}>Go Back</button>
      </section>
    );
  }

  async function handleRefresh() {
    try {
      setRefreshError(null);
      await roomStore.fetchRoom();
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
    }
  }

  async function handleStartGame() {
    try {
      setRefreshError(null);
      await roomStore.startGame();
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
    }
  }

  const canStartGame = isHost && room.participants.length >= 2;

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
          <p style={{ marginTop: '8px' }}>{error ?? refreshError ?? "Waiting for the host to start the game."}</p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        {isHost ? (
          <button className="button button--primary" disabled={isLoading || !canStartGame} onClick={handleStartGame}>
            Start Game
          </button>
        ) : (
          <span style={{ fontSize: "14px", color: "#6b7280" }}>Waiting for host...</span>
        )}
      </div>
    </section>
  );
}
