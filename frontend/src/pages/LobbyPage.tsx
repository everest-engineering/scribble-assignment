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
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    roomStore.startPolling();
    return () => roomStore.stopPolling();
  }, [roomStore]);

  // Once the host starts the round, every player (incl. guessers, via polling) advances to the game.
  useEffect(() => {
    if (room && room.status !== "lobby") {
      navigate("/game");
    }
  }, [navigate, room]);

  async function handleRefresh() {
    try {
      setRefreshError(null);
      await roomStore.fetchRoom();
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
    }
  }

  async function handleStart() {
    try {
      setRefreshError(null);
      await roomStore.startGame();
      navigate("/game");
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to start the game");
    }
  }

  if (!room) {
    return null;
  }

  const isHost = Boolean(participantId && room.hostId === participantId);
  const hasEnoughPlayers = room.participants.length >= 2;
  const canStart = isHost && hasEnoughPlayers;

  let startHint = "Waiting for the host to start the game.";
  if (isHost && !hasEnoughPlayers) {
    startHint = "At least 2 players are needed to start.";
  } else if (isHost) {
    startHint = "You are the host. Start the game when everyone is ready.";
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
        <Card title={`Participants (${room.participants.length})`}>
          {room.participants.length === 0 ? (
            <p>No participants are connected to this room yet.</p>
          ) : (
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>
                    {participant.name}
                    {participant.id === room.hostId ? " 👑" : ""}
                  </span>
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
          <p style={{ marginTop: '8px' }}>{error ?? refreshError ?? startHint}</p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        {isHost ? (
          <button
            className="button button--primary"
            disabled={!canStart || isLoading}
            title={canStart ? undefined : "At least 2 players are needed to start."}
            onClick={handleStart}
          >
            Start Game
          </button>
        ) : null}
      </div>
    </section>
  );
}
