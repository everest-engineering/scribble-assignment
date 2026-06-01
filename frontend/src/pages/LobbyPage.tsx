import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";
import { createPoller } from "../services/polling";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, error, isLoading, participantId } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room) return;
    const poller = createPoller(() => roomStore.fetchRoom(), 2000, 500);
    poller.start();

    return () => {
      poller.stop();
    };
  }, [room, roomStore]);

  // If the room status changes to in-game (started by host), navigate all
  // participants to the GamePage so they see the active round.
  useEffect(() => {
    if (!room) return;
    if (room.status === "in-game") {
      navigate("/game");
    }
  }, [room, navigate]);

  async function handleRefresh() {
    try {
      setRefreshError(null);
      await roomStore.fetchRoom();
    } catch (caughtError) {
      setRefreshError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to refresh room"
      );
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
                  <span className="player-list__meta">joined</span>
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
          <p style={{ marginTop: "8px" }}>
            {error ?? refreshError ?? "Waiting for the host to start the game."}
          </p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button
          className="button button--secondary"
          disabled={isLoading}
          onClick={handleRefresh}
        >
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        <button
          className="button button--primary"
          disabled={
            isLoading ||
            room.participants.length < 2 ||
            room.hostId !== participantId
          }
          onClick={async () => {
            try {
              await roomStore.startRoom();
              navigate("/game");
            } catch (err) {
              // Surface friendly message for missing starter words
              const code = (err as any)?.code;
              if (code === "ERR_NO_WORDS") {
                setRefreshError(
                  "Cannot start game: no starter words configured."
                );
                return;
              }

              setRefreshError(
                err instanceof Error ? err.message : "Unable to start game"
              );
            }
          }}
        >
          {room.hostId !== participantId
            ? "Only host can start"
            : isLoading
              ? "Starting..."
              : "Start Game"}
        </button>
      </div>
    </section>
  );
}
