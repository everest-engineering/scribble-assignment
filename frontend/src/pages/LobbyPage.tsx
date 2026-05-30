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
  const isHost = Boolean(room && participantId && room.hostParticipantId === participantId);
  const canStart = Boolean(isHost && room && room.participants.length >= 2 && room.status === "lobby");

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "in-game") {
      navigate("/game", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room || room.status !== "lobby") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void roomStore.fetchRoom().catch(() => undefined);
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [room, roomStore]);

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
      const nextRoom = await roomStore.startRoom();

      if (nextRoom?.status === "in-game") {
        navigate("/game");
      }
    } catch {
      // The room store surfaces the API message in state for display.
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
                  <span>{participant.name}</span>
                  <span className={participant.id === room.hostParticipantId ? "player-list__badge" : "player-list__meta"}>
                    {participant.id === room.hostParticipantId ? "Host" : "Joined"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className="status-line" style={{ backgroundColor: isLoading ? '#fef3c7' : '#e0e7ff', color: isLoading ? '#b45309' : '#3730a3' }}>
            {isLoading ? "Refreshing players..." : room.status === "in-game" ? "Game started" : "Ready to play"}
          </p>
          <p style={{ marginTop: '8px' }}>
            {error ??
              refreshError ??
              (isHost ? "Start when at least two players are ready." : "Waiting for the host to start the game.")}
          </p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        <button className="button button--primary" disabled={!canStart || isLoading} onClick={handleStart}>
          {isHost ? "Start Game" : "Host Starts Game"}
        </button>
      </div>
    </section>
  );
}
