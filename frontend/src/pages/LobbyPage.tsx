import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomPolling, useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL_MS = 2000;
const MIN_PLAYERS_TO_START = 2;

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, error, isLoading } = useRoomState();
  const [startError, setStartError] = useState<string | null>(null);

  useRoomPolling(POLL_INTERVAL_MS);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  // Once the host starts the round, everyone polling the lobby is moved to the game.
  useEffect(() => {
    if (room && room.status !== "lobby") {
      navigate("/game", { replace: true });
    }
  }, [navigate, room]);

  if (!room) {
    return null;
  }

  const isHost = room.viewer?.isHost ?? false;
  const playerCount = room.participants.length;
  const canStart = isHost && playerCount >= MIN_PLAYERS_TO_START;

  async function handleStart() {
    try {
      setStartError(null);
      await roomStore.startGame();
    } catch (caughtError) {
      setStartError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
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
        <Card title={`Participants (${playerCount})`}>
          {playerCount === 0 ? (
            <p>No participants are connected to this room yet.</p>
          ) : (
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>{participant.name}</span>
                  <span className="player-list__meta">
                    {participant.isHost ? "host" : "ready"}
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
            {isLoading ? "Syncing players..." : "Ready to play"}
          </p>
          <p style={{ marginTop: "8px" }}>
            {startError ??
              error ??
              (isHost
                ? playerCount >= MIN_PLAYERS_TO_START
                  ? "You are the host. Start when everyone is in."
                  : "Need at least 2 players before you can start."
                : "Waiting for the host to start the game.")}
          </p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" onClick={() => navigate("/")}>
          Leave Lobby
        </button>
        {isHost ? (
          <button className="button button--primary" disabled={!canStart} onClick={handleStart}>
            Start Game
          </button>
        ) : null}
      </div>
    </section>
  );
}
