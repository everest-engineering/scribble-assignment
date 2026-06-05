import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [pollError, setPollError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room) return;

    intervalRef.current = setInterval(async () => {
      try {
        const updated = await roomStore.fetchRoom();
        setPollError(null);
        if (updated?.status === "active") {
          navigate("/game");
        }
      } catch (err) {
        setPollError(err instanceof Error ? err.message : "Unable to refresh room");
      }
    }, 2000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [room?.code]);

  if (!room) {
    return null;
  }

  const isHost = participantId === room.hostId;
  const canStart = isHost && room.participants.length >= 2;

  async function handleStartGame() {
    try {
      setStartError(null);
      await roomStore.startGame();
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "Unable to start game");
    }
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
                    {participant.id === room.hostId ? "host" : "joined"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className="status-line" style={{ backgroundColor: "#e0e7ff", color: "#3730a3" }}>
            {isHost ? "You are the host" : "Waiting for the host to start the game"}
          </p>
          {pollError ? <p className="form__error" style={{ marginTop: "8px" }}>{pollError}</p> : null}
          {startError ? <p className="form__error" style={{ marginTop: "8px" }}>{startError}</p> : null}
          {!pollError && !startError ? (
            <p style={{ marginTop: "8px" }}>
              {room.participants.length < 2
                ? "Waiting for at least 2 players to join."
                : "Ready to start!"}
            </p>
          ) : null}
        </Card>
      </div>

      {isHost ? (
        <div className="button-row button-row--spread">
          <button
            className="button button--primary"
            disabled={!canStart}
            onClick={handleStartGame}
          >
            {canStart ? "Start Game" : "Need 2+ players to start"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
