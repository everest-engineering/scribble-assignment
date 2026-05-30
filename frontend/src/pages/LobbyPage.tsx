import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, error, isLoading, participantId } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchParams] = useSearchParams();
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const code = searchParams.get("code");
    const pid = searchParams.get("participantId");

    if (!room) {
      if (code && pid) {
        roomStore
          .initializeFromUrl(code, pid)
          .then(() => setIsRestoring(false))
          .catch(() => {
            setIsRestoring(false);
            navigate("/", { replace: true });
          });
      } else {
        setIsRestoring(false);
        navigate("/", { replace: true });
      }
    } else {
      setIsRestoring(false);
    }
  }, [room, searchParams, roomStore, navigate]);

  useEffect(() => {
    if (room?.status === "game" && participantId) {
      navigate(`/game?code=${room.code}&participantId=${participantId}`);
    }
  }, [room?.status, room?.code, participantId, navigate]);

  useEffect(() => {
    if (!room) return;

    const interval = setInterval(() => {
      roomStore.fetchRoom().catch((caughtError) => {
        console.error("Lobby polling error:", caughtError);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [room, roomStore]);

  async function handleRefresh() {
    try {
      setIsRefreshing(true);
      setRefreshError(null);
      await roomStore.fetchRoom();
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleLeaveRoom() {
    try {
      await roomStore.leaveRoom();
      navigate("/");
    } catch (caughtError) {
      console.error("Leave room failed:", caughtError);
    }
  }

  if (isRestoring || (isLoading && !room)) {
    return (
      <section className="panel placeholder-page">
        <p>Loading session...</p>
      </section>
    );
  }

  if (!room) {
    return null;
  }

  const isHost = room && participantId === room.hostId;

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
              {room.participants.map((participant) => {
                const isParticipantHost = participant.id === room.hostId;
                return (
                  <li key={participant.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>{participant.name}</span>
                      {isParticipantHost && (
                        <span
                          className="badge badge--host"
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            backgroundColor: "#dbeafe",
                            color: "#1e40af",
                            padding: "2px 8px",
                            borderRadius: "9999px"
                          }}
                        >
                          Host
                        </span>
                      )}
                    </div>
                    <span className="player-list__meta">{participant.score} pts</span>
                  </li>
                );
              })}
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
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            className="button button--secondary"
            disabled={isLoading || isRefreshing}
            onClick={handleRefresh}
          >
            {isRefreshing ? "Refreshing..." : "Refresh Room"}
          </button>
          <button
            className="button button--secondary"
            style={{ borderColor: "#fee2e2", color: "#b91c1c", backgroundColor: "#fef2f2" }}
            disabled={isLoading}
            onClick={handleLeaveRoom}
          >
            Leave Room
          </button>
        </div>
        {isHost && (
          <button
            className="button button--primary"
            disabled={room.participants.length < 2 || isLoading}
            onClick={async () => {
              try {
                await roomStore.startGame();
              } catch (caughtError) {
                console.error("Start game failed:", caughtError);
              }
            }}
          >
            Start Game
          </button>
        )}
      </div>
    </section>
  );
}
