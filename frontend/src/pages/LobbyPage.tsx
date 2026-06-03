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
  const { room, participantId, error, isLoading } = useRoomState();
  const [pollError, setPollError] = useState<string | null>(null);
  const navigatedRef = useRef(false);

  // Redirect to start if no room session
  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  // Polling loop — runs silently in background
  useEffect(() => {
    if (!room) return;

    const id = setInterval(async () => {
      try {
        const updated = await roomStore.fetchRoom();
        setPollError(null);

        if (updated && updated.status === "in-progress" && !navigatedRef.current) {
          navigatedRef.current = true;
          navigate("/game", { replace: true });
        }
      } catch {
        setPollError("Unable to refresh room — retrying…");
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.code]);

  if (!room) {
    return null;
  }

  const isHost = participantId === room.hostId;
  const canStart = isHost && room.participants.length >= 2;

  async function handleStartGame() {
    try {
      const updated = await roomStore.startGame();
      if (updated && updated.status === "in-progress" && !navigatedRef.current) {
        navigatedRef.current = true;
        navigate("/game", { replace: true });
      }
    } catch {
      // error is surfaced via store state
    }
  }

  const displayError = pollError ?? error;

  return (
    <section className="panel">
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
            <ul className="player-list" aria-live="polite" aria-label="Participants">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>{participant.name}</span>
                  {participant.id === room.hostId ? (
                    <span className="player-list__meta">host</span>
                  ) : (
                    <span className="player-list__meta">joined</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          {displayError ? (
            <p className="form__error">{displayError}</p>
          ) : (
            <p>Waiting for the host to start the game.</p>
          )}
        </Card>
      </div>

      <div className="button-row button-row--spread">
        {isHost ? (
          <>
            {!canStart && !isLoading ? (
              <p className="form__hint">Need at least 2 players to start.</p>
            ) : null}
            <button
              className="button button--primary"
              onClick={handleStartGame}
              disabled={!canStart || isLoading}
              aria-disabled={!canStart || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner" aria-label="Starting game…" />
                  Starting…
                </>
              ) : (
                "Start Game"
              )}
            </button>
          </>
        ) : (
          <button
            className="button button--primary"
            disabled
            aria-disabled="true"
          >
            Start Game
          </button>
        )}
      </div>
    </section>
  );
}
