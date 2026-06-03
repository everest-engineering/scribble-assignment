import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { readActiveRoom, readIdentity } from "../state/identityStorage";
import { useLobbyPolling } from "../state/useLobbyPolling";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const hasHydrated = useRef(false);

  useLobbyPolling(room?.code ?? null);

  const isHost = !!room && !!participantId && room.hostParticipantId === participantId;
  const playerCount = room?.participants.length ?? 0;
  const canStart = isHost && playerCount >= 2;

  useEffect(() => {
    if (room) return;

    if (hasHydrated.current) {
      navigate("/", { replace: true });
      return;
    }
    hasHydrated.current = true;

    const activeRoom = readActiveRoom();
    if (!activeRoom) {
      navigate("/", { replace: true });
      return;
    }

    const identity = readIdentity(activeRoom);
    if (!identity) {
      navigate("/", { replace: true });
      return;
    }

    roomStore.hydrateSession(activeRoom, identity.participantId).catch(() => {
      setRefreshError("This room is no longer available.");
    });
  }, [navigate, room, roomStore]);

  useEffect(() => {
    if (room?.status === "playing") {
      navigate("/game", { replace: true });
    }
  }, [navigate, room?.status]);

  async function handleStart() {
    try {
      setRefreshError(null);
      await roomStore.startGame();
    } catch (caughtError) {
      setRefreshError(
        caughtError instanceof Error ? caughtError.message : "Unable to start the game"
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
                  <span className="player-list__meta">
                    {participant.id === room.hostParticipantId ? "host" : "joined"}
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
            {isLoading ? "Connecting..." : "Ready to play"}
          </p>
          <p style={{ marginTop: "8px" }} aria-live="polite">
            {error ?? refreshError ?? "Waiting for the host to start the game."}
          </p>
        </Card>
      </div>

      {isHost ? (
        <div className="button-row button-row--spread">
          <button
            className="button button--primary"
            disabled={!canStart || isLoading}
            onClick={handleStart}
          >
            Start Game
          </button>
          {!canStart ? (
            <p className="status-line" style={{ marginLeft: "12px" }}>
              Waiting for another player to join…
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
