import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL_MS = 2000;

export function ResultsPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [actionError, setActionError] = useState<string | null>(null);

  // No room (initial load or closed room) → back to the start.
  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  // Poll ~every 2s so a non-host on the result screen picks up the host's
  // restart (status → "lobby") and the result stays fresh. (FR-007, FR-012)
  useEffect(() => {
    if (!room) {
      return;
    }

    const interval = window.setInterval(() => {
      roomStore.fetchRoom().catch(() => {
        // Errors surface via store state; ignore here to keep polling.
      });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [roomStore, room?.code]);

  // When the host restarts, every player's poll sees "lobby" → return there.
  // A defensive "playing" check covers a fast restart→start sequence. (FR-012)
  useEffect(() => {
    if (room?.status === "lobby") {
      navigate("/lobby");
    } else if (room?.status === "playing") {
      navigate("/game");
    }
  }, [navigate, room?.status]);

  if (!room) {
    return null;
  }

  const round = room.round;
  const isHost = participantId === room.hostId;
  const drawer = round
    ? room.participants.find((participant) => participant.id === round.drawerId) ?? null
    : null;

  async function handleRestart() {
    try {
      setActionError(null);
      await roomStore.restartGame();
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to restart the game");
    }
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {round?.number ?? 1} — Results</span>
          <h1 className="game-page__title">Round over!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <Card title="The word was">
            <div className="word-reveal" style={{ textAlign: "center", padding: "16px" }}>
              <strong
                className="word-reveal__word"
                style={{ fontSize: "1.75rem", letterSpacing: "0.1em" }}
              >
                {round?.word ?? "—"}
              </strong>
              <p className="word-reveal__hint" style={{ marginTop: "8px", color: "#6b7280" }}>
                {drawer ? `${drawer.name} was drawing.` : "The round has ended."}
              </p>
            </div>
          </Card>

          <Card title="Final Scores">
            <p style={{ color: "#6b7280" }}>
              {isHost
                ? "Restart to send everyone back to the lobby and play again."
                : "Waiting for the host to restart the game."}
            </p>
            {actionError ? (
              <p className="status-line" style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}>
                {actionError}
              </p>
            ) : null}
          </Card>
        </div>
      </div>

      <div className="button-row">
        {isHost ? (
          <button className="button button--primary" onClick={handleRestart}>
            Restart
          </button>
        ) : null}
      </div>
    </section>
  );
}
