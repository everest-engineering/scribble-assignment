import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import type { RoomSessionResponse } from "../services/api";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const roomStore = useRoomStore();
  const { room, participantId, hostParticipantId, roomStatus, error, isLoading } = useRoomState();
  const [actionError, setActionError] = useState<string | null>(null);
  const roomStatusRef = useRef(roomStatus);
  const cleanupArmedRef = useRef(false);
  const locationSession = location.state as RoomSessionResponse | null;
  const activeRoom = room ?? locationSession?.room ?? null;
  const activeParticipantId = participantId ?? locationSession?.participantId ?? null;
  const activeHostParticipantId = hostParticipantId ?? locationSession?.room.hostParticipantId ?? null;
  const activeRoomStatus = roomStatus ?? locationSession?.room.status ?? null;
  const roomCode = activeRoom?.code ?? null;

  roomStatusRef.current = activeRoomStatus;

  useEffect(() => {
    if (!room && locationSession?.room && locationSession.participantId) {
      roomStore.setRoomSession(locationSession);
    }
  }, [locationSession, room, roomStore]);

  useEffect(() => {
    if (!activeRoom && !activeParticipantId) {
      navigate("/", { replace: true });
    }
  }, [activeParticipantId, activeRoom, navigate]);

  useEffect(() => {
    if (activeRoomStatus === "game") {
      navigate("/game", { replace: true });
    }
  }, [activeRoomStatus, navigate]);

  useEffect(() => {
    if (!roomCode || activeRoomStatus !== "lobby" || !activeParticipantId) {
      return;
    }

    cleanupArmedRef.current = false;
    const cleanupTimerId = window.setTimeout(() => {
      cleanupArmedRef.current = true;
    }, 0);

    roomStore.startLobbyPolling();

    return () => {
      window.clearTimeout(cleanupTimerId);
      roomStore.stopLobbyPolling();

      if (cleanupArmedRef.current && roomStatusRef.current === "lobby") {
        void roomStore.leaveRoom();
      }
    };
  }, [activeParticipantId, activeRoomStatus, roomCode, roomStore]);

  async function handleRefresh() {
    try {
      setActionError(null);
      await roomStore.fetchRoom();
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
    }
  }

  async function handleStartGame() {
    if (!activeRoom || !activeParticipantId) {
      return;
    }

    try {
      setActionError(null);
      await roomStore.startRoom(activeRoom.code);
      roomStatusRef.current = "game";
      navigate("/game", { replace: true });
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
    }
  }

  if (!activeRoom) {
    return null;
  }

  const isHost = activeParticipantId === activeHostParticipantId;
  const hostName = activeRoom.participants.find((participant) => participant.id === activeHostParticipantId)?.name ?? "Unknown host";
  const canStart = isHost && activeRoom.participants.length >= 2 && activeRoomStatus === "lobby";
  const statusMessage = !isHost
    ? "Only the host can start the game."
    : activeRoom.participants.length < 2
      ? "Need at least 2 players before starting."
      : "Ready to start.";

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <PageHeader
          kicker="Waiting for players"
          title="Lobby"
          description="Share the room code with friends so they can join your game."
        />
        <RoomCodeBadge code={activeRoom.code} />
      </div>

      <div className="summary-grid">
        <Card title="Participants">
          {activeRoom.participants.length === 0 ? (
            <p>No participants are connected to this room yet.</p>
          ) : (
            <ul className="player-list">
              {activeRoom.participants.map((participant) => (
                <li key={participant.id}>
                  <span>{participant.name}</span>
                  <span className="player-list__meta">
                    {participant.id === activeHostParticipantId ? "host" : "joined"}
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
          <p style={{ marginTop: "8px" }}>{error ?? actionError ?? "Waiting for the host to start the game."}</p>
          <p style={{ marginTop: "8px" }}>Host: {hostName}</p>
          <p style={{ marginTop: "8px" }}>{statusMessage}</p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>

        {isHost ? (
          <button className="button button--primary" disabled={!canStart || isLoading} onClick={handleStartGame}>
            Start Game
          </button>
        ) : null}
      </div>
    </section>
  );
}
