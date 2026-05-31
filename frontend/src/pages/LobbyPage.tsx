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
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(async () => {
      try {
        await roomStore.fetchRoom();
      } catch {
        // polling errors are silent — state updates on next successful poll
      }
    }, 2000);
  }, [roomStore]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (room) {
      startPolling();
    }
    return stopPolling;
  }, [room, startPolling, stopPolling]);

  async function handleRefresh() {
    stopPolling();
    try {
      setRefreshError(null);
      await roomStore.fetchRoom();
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
    }
    startPolling();
  }

  async function handleStartGame() {
    try {
      setStartError(null);
      const updatedRoom = await roomStore.startGame();
      if (updatedRoom) {
        navigate("/game");
      }
    } catch (caughtError) {
      setStartError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
    }
  }

  if (!room) {
    return null;
  }

  const isHost = participantId === room.hostId;
  const hasMinPlayers = room.participants.length >= 2;
  const canStart = isHost && hasMinPlayers;

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
          <p className="status-line" style={{ backgroundColor: isLoading ? '#fef3c7' : '#e0e7ff', color: isLoading ? '#b45309' : '#3730a3' }}>
            {isLoading ? "Refreshing players..." : "Ready to play"}
          </p>
          <p style={{ marginTop: '8px' }}>
            {error ?? refreshError ?? startError ?? (
              !hasMinPlayers ? "Waiting for at least 2 players to start." : "Waiting for the host to start the game."
            )}
          </p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        <button className="button button--primary" disabled={!canStart} onClick={handleStartGame}>
          {!hasMinPlayers ? "Need 2+ Players" : !isHost ? "Waiting for Host" : "Start Game"}
        </button>
      </div>
    </section>
  );
}