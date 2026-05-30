import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL_MS = 2000;

function getStartBlockedReason(
  isHost: boolean,
  participantCount: number,
  status: string
): string | null {
  if (status !== "lobby") {
    return null;
  }

  if (!isHost) {
    return "Only the host can start the game.";
  }

  if (participantCount < 2) {
    return "At least two players are required to start.";
  }

  return null;
}

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room || room.status !== "lobby") {
      return;
    }

    const intervalId = window.setInterval(async () => {
      try {
        setPollError(null);
        const snapshot = await roomStore.fetchRoomSilent();

        if (snapshot?.status === "playing") {
          navigate("/game");
        }
      } catch (caughtError) {
        setPollError(
          caughtError instanceof Error ? caughtError.message : "Unable to refresh lobby"
        );
      }
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [navigate, room, room?.code, room?.status, roomStore]);

  useEffect(() => {
    if (room?.status === "playing") {
      navigate("/game");
    }
  }, [navigate, room?.status]);

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
      navigate("/game");
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
    }
  }

  if (!room) {
    return null;
  }

  const isHost = participantId === room.hostParticipantId;
  const canStart =
    isHost && room.status === "lobby" && room.participants.length >= 2 && !isLoading;
  const startBlockedReason = getStartBlockedReason(isHost, room.participants.length, room.status);
  const statusMessage =
    pollError ?? error ?? refreshError ?? startBlockedReason ?? "Waiting for the host to start the game.";

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
                    {participant.isHost ? "host" : "joined"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p
            className="status-line"
            style={{
              backgroundColor: isLoading ? "#fef3c7" : "#e0e7ff",
              color: isLoading ? "#b45309" : "#3730a3"
            }}
          >
            {isLoading ? "Refreshing players..." : "Ready to play"}
          </p>
          <p style={{ marginTop: "8px" }}>{statusMessage}</p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        <button
          className="button button--primary"
          disabled={!canStart}
          onClick={handleStartGame}
        >
          Start Game
        </button>
      </div>
    </section>
  );
}
