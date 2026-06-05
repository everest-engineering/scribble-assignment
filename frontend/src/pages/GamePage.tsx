import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import type { Stroke } from "../services/api";
import { useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL_MS = 2000;

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [actionError, setActionError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (room?.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room?.status]);

  useEffect(() => {
    if (!room) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      roomStore.fetchRoom().catch((caughtError) => {
        setRefreshError(
          caughtError instanceof Error ? caughtError.message : "Unable to refresh game"
        );
      });
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [room, roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((participant) => participant.id === room.drawerId) ?? null;
  const isDrawer = viewer?.role === "drawer";
  const isHost = Boolean(participantId) && room.hostId === participantId;
  const roundEnded = room.roundEnded;
  const canDraw = isDrawer && !roundEnded;
  const canGuess = !isDrawer && !roundEnded;

  async function handleRestart() {
    try {
      setActionError(null);
      await roomStore.restartGame();
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to restart game");
    }
  }

  async function handleStrokeComplete(stroke: Stroke) {
    try {
      setActionError(null);
      await roomStore.submitStroke(stroke);
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to send stroke");
    }
  }

  async function handleClear() {
    try {
      setActionError(null);
      await roomStore.clearCanvas();
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to clear canvas");
    }
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} />
          <ResultPanel guesses={room.guesses} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <p className="status-line" style={{ backgroundColor: "#e0e7ff", color: "#3730a3" }}>
              {roundEnded
                ? "The round has ended."
                : isDrawer
                  ? "You are the drawer."
                  : `${drawer?.name ?? "The host"} is the drawer.`}
            </p>
            {roundEnded ? (
              <p
                className="status-line"
                style={{ marginTop: "8px", backgroundColor: "#dcfce7", color: "#166534" }}
              >
                The word was: <strong>{room.secretWord ?? "—"}</strong>
              </p>
            ) : isDrawer ? (
              <p style={{ marginTop: "8px" }}>
                Your secret word: <strong>{room.secretWord ?? "…"}</strong>
              </p>
            ) : (
              <p style={{ marginTop: "8px" }}>Guess the word the drawer is drawing.</p>
            )}
            <div style={{ marginTop: "12px" }}>
              <DrawingCanvas
                strokes={room.strokes}
                canDraw={canDraw}
                onStrokeComplete={handleStrokeComplete}
                onClear={handleClear}
              />
            </div>
            {actionError ? (
              <p className="form__error" style={{ marginTop: "8px" }}>
                {actionError}
              </p>
            ) : null}
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{roundEnded ? "Round over" : "Playing"}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Your Guess">
            {isDrawer ? (
              <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                You are drawing this round — guessing is disabled.
              </p>
            ) : (
              <>
                <GuessForm disabled={!canGuess} />
                {roundEnded ? (
                  <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "8px" }}>
                    The round has ended. No more guesses.
                  </p>
                ) : null}
              </>
            )}
          </Card>
          {refreshError ? <p className="form__error">{refreshError}</p> : null}
        </aside>
      </div>

      <div className="button-row">
        {roundEnded && isHost ? (
          <button className="button button--primary" onClick={handleRestart}>
            Restart Game
          </button>
        ) : null}
        {roundEnded && !isHost ? (
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Waiting for the host to restart…
          </p>
        ) : null}
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
