import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading } = useRoomState();
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    roomStore.startPolling();

    return () => {
      roomStore.stopPolling();
    };
  }, [navigate, room, roomStore]);

  useEffect(() => {
    if (room?.status === "playing") {
      navigate("/game");
    }
  }, [navigate, room?.status]);

  const isHost = room ? participantId !== null && room.hostId === participantId : false;
  const isPostGame = (room?.roundCounter ?? 0) > 0;
  const isGameComplete = (room?.maxRounds ?? 0) > 0 && (room?.roundCounter ?? 0) >= (room?.maxRounds ?? 0);

  const handleStartGame = useCallback(async () => {
    try {
      const updatedRoom = await roomStore.startGame();
      if (updatedRoom && updatedRoom.status === "playing") {
        navigate("/game");
      }
    } catch {
      // Error is set in roomStore state
    }
  }, [navigate, roomStore]);

  const handleStartNewRound = useCallback(async () => {
    setActionError(null);
    try {
      const result = await roomStore.startNewRound();
      if (result) {
        navigate("/game");
      }
    } catch {
      setActionError("Failed to start new round. Please try again.");
    }
  }, [navigate, roomStore]);

  const handleLeaveRoom = useCallback(async () => {
    try {
      await roomStore.leaveRoom();
      navigate("/", { replace: true });
    } catch {
      // Error is set in roomStore state
    }
  }, [navigate, roomStore]);

  if (!room) {
    return null;
  }

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <PageHeader
          kicker={isGameComplete ? "Game Complete" : isPostGame ? "Back to Lobby" : "Waiting for players"}
          title={isGameComplete ? "Game Complete" : "Lobby"}
          description={isGameComplete ? "All rounds are complete. Thank you for playing!" : "Share the room code with friends so they can join your game."}
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
                      <span className="host-badge"> (host)</span>
                    ) : null}
                  </span>
                  <span className="player-list__meta">joined</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={isPostGame ? `Round ${room.roundCounter} of ${room.maxRounds}` : "Status"}>
          <p className="status-line" style={{ backgroundColor: isLoading ? '#fef3c7' : '#e0e7ff', color: isLoading ? '#b45309' : '#3730a3' }}>
            {isLoading ? "Refreshing players..." : isGameComplete ? "Complete" : "Ready to play"}
          </p>
          <p style={{ marginTop: '8px' }}>
            {isGameComplete
              ? "All rounds have been completed."
              : error ?? "Waiting for the host to start."}
          </p>
        </Card>
      </div>

      {actionError && (
        <p style={{ color: "red", fontSize: "0.875rem", textAlign: "center", marginTop: "8px" }}>{actionError}</p>
      )}

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={handleLeaveRoom}>
          Leave Room
        </button>
        {isHost && !isGameComplete ? (
          isPostGame ? (
            <button
              className="button button--primary"
              disabled={isLoading || room.participants.length < 2}
              onClick={handleStartNewRound}
            >
              {isLoading ? "Starting..." : "Start New Round"}
            </button>
          ) : (
            <button
              className="button button--primary"
              disabled={isLoading || room.participants.length < 2}
              onClick={handleStartGame}
            >
              {isLoading ? "Starting..." : "Start Game"}
            </button>
          )
        ) : null}
      </div>
    </section>
  );
}
