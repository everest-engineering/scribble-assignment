import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL = 2000;

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, error, isLoading } = useRoomState();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  const doPoll = useCallback(async () => {
    try {
      const updatedRoom = await roomStore.fetchRoom();

      if (updatedRoom && updatedRoom.status !== "lobby") {
        navigate("/game");
      }
    } catch {
      // poll errors are non-fatal
    }
  }, [roomStore, navigate]);

  useEffect(() => {
    pollRef.current = setInterval(doPoll, POLL_INTERVAL);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [doPoll]);

  async function handleStartGame() {
    try {
      await roomStore.startGame();
      navigate("/game");
    } catch {
      // error handled by store
    }
  }

  if (!room) {
    return null;
  }

  const isHost = roomStore.isHost;
  const hasMinPlayers = room.participants.length >= 2;

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
                  <span>
                    {participant.name}
                    {participant.id === room.hostId ? (
                      <span className="player-list__badge"> Host</span>
                    ) : null}
                  </span>
                  <span className="player-list__meta">joined</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className="status-line" style={{ backgroundColor: isLoading ? '#fef3c7' : '#e0e7ff', color: isLoading ? '#b45309' : '#3730a3' }}>
            {isLoading ? "Refreshing players..." : "Ready to play"}
          </p>
          <p style={{ marginTop: '8px' }}>{error ?? (isHost ? "You are the host. Start the game when at least 2 players have joined." : "Waiting for the host to start the game.")}</p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <div />
        {isHost ? (
          <button
            className="button button--primary"
            disabled={!hasMinPlayers || isLoading}
            onClick={handleStartGame}
          >
            {!hasMinPlayers ? "Waiting for players..." : "Start Game"}
          </button>
        ) : (
          <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Only the host can start the game</p>
        )}
      </div>
    </section>
  );
}
