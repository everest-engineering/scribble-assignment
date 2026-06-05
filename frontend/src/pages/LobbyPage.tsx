import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL_MS = 2000;

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [pollError, setPollError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    intervalRef.current = setInterval(async () => {
      try {
        const updated = await roomStore.fetchRoom();
        setPollError(null);

        if (updated && updated.status !== "lobby") {
          if (intervalRef.current) clearInterval(intervalRef.current);
          navigate("/game");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to refresh room";
        if (message === "Unable to load room") {
          if (intervalRef.current) clearInterval(intervalRef.current);
          navigate("/", { replace: true });
        } else {
          setPollError(message);
        }
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [navigate, room, roomStore]);

  if (!room) {
    return null;
  }

  const isHost = room.hostId === participantId;
  const canStart = isHost && room.participants.length >= 2;

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
          <p
            className="status-line"
            style={{ backgroundColor: "#e0e7ff", color: "#3730a3" }}
          >
            Ready to play
          </p>
          {pollError ? (
            <p style={{ marginTop: "8px", color: "#b91c1c" }}>{pollError}</p>
          ) : (
            <p style={{ marginTop: "8px" }}>Waiting for the host to start the game.</p>
          )}
        </Card>
      </div>

      <div className="button-row button-row--spread">
        {isHost ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <button
              className="button button--primary"
              disabled={!canStart}
              onClick={async () => {
                try {
                  await roomStore.startRoom();
                  navigate("/game");
                } catch (error) {
                  setPollError(error instanceof Error ? error.message : "Unable to start game");
                }
              }}
            >
              Start Game
            </button>
            {!canStart && (
              <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                Need at least 2 players to start
              </span>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
