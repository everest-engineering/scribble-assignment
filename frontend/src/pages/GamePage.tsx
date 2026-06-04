import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room || room.status !== "playing") return;
    const id = setInterval(() => {
      roomStore.fetchRoom().catch(() => undefined);
    }, 2000);
    return () => clearInterval(id);
  }, [room?.status, roomStore]);

  useEffect(() => {
    if (room?.status === "lobby") {
      navigate("/lobby");
    }
  }, [room?.status, navigate]);

  if (!room) {
    return null;
  }

  const isDrawer = room.drawer === participantId;
  const isHost = room.hostId === participantId;
  const viewer = room.participants.find((p) => p.id === participantId) ?? null;

  async function handleEndGame() {
    try {
      setActionError(null);
      await roomStore.endGame();
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to end game");
    }
  }

  async function handleRestart() {
    try {
      setActionError(null);
      await roomStore.restartGame();
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to restart game");
    }
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">
            {isDrawer ? "You are Drawing" : "You are Guessing"}
          </span>
          {isDrawer && room.secretWord && (
            <p style={{ fontWeight: 700, fontSize: '1.25rem', color: '#1f2937', margin: '4px 0 0' }}>
              Word: <strong>{room.secretWord}</strong>
            </p>
          )}
          <h1 className="game-page__title">
            {isDrawer ? "Draw the word!" : "Guess the Word!"}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      {actionError && (
        <p className="form__error" style={{ marginBottom: '8px' }}>{actionError}</p>
      )}

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <DrawingCanvas
            canDraw={isDrawer}
            canvasData={room.canvasData}
            onStrokeEnd={(dataUrl) => roomStore.updateCanvas(dataUrl)}
          />
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              <strong>Player:</strong> {viewer?.name ?? "Unknown"}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              <strong>Role:</strong> {isDrawer ? "Drawer" : "Guesser"}
            </p>
          </div>

          {room.status === "playing" && (
            <GuessForm
              disabled={isDrawer}
              onSubmit={(text) => roomStore.submitGuess(text)}
            />
          )}
        </aside>
      </div>

      <div className="button-row">
        {isHost && room.status === "playing" && (
          <button className="button button--secondary" onClick={handleEndGame}>
            End Round
          </button>
        )}
        {isHost && room.status === "result" && (
          <button className="button button--primary" onClick={handleRestart}>
            Play Again
          </button>
        )}
      </div>
    </section>
  );
}
