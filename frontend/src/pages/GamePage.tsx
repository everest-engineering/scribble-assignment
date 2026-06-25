import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading } = useRoomState();
  const [actionError, setActionError] = useState<string | null>(null);

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
      return;
    }

    const intervalId = window.setInterval(() => {
      roomStore.fetchRoom().catch(() => undefined);
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [room?.code, roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = room.drawerId === participantId;
  const isHost = room.hostId === participantId;
  const isRoundActive = room.status === "playing";
  const drawerName = room.drawerName ?? "Unknown drawer";
  const displayedError = actionError ?? error;
  const canvasHint = isRoundActive
    ? isDrawer
      ? "Draw the secret word here."
      : "Waiting for the drawer to sketch."
    : "The round is complete.";
  const guessDisabledReason = isRoundActive
    ? isDrawer
      ? "You are drawing this round."
      : undefined
    : "Guessing is closed.";

  async function handleDrawingChange(drawingDataUrl: string) {
    try {
      setActionError(null);
      await roomStore.updateDrawing(drawingDataUrl);
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to save drawing");
    }
  }

  async function handleClearDrawing() {
    try {
      setActionError(null);
      await roomStore.clearDrawing();
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to clear drawing");
    }
  }

  async function handleGuess(guess: string) {
    setActionError(null);
    await roomStore.submitGuess(guess);
  }

  async function handleRestart() {
    try {
      setActionError(null);
      await roomStore.restartGame();
      navigate("/lobby");
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to restart game");
    }
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">
            {room.status === "result" ? "Round Results" : `${drawerName} is drawing`}
          </h1>
          <p className="game-page__subtitle">
            {room.secretWord
              ? `Secret word: ${room.secretWord}`
              : room.wordLength
                ? `Secret word: ${room.wordLength} letters`
                : "Waiting for the round to start."}
          </p>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard scores={room.scores} drawerId={room.drawerId} />
          <ResultPanel room={room} isHost={isHost} isLoading={isLoading} onRestart={handleRestart} />
        </aside>

        <div className="game-page__main">
          <Card
            title="Canvas"
            footer={
              isDrawer && isRoundActive ? (
                <button className="button button--secondary" type="button" disabled={isLoading} onClick={handleClearDrawing}>
                  Clear Canvas
                </button>
              ) : null
            }
          >
            <DrawingCanvas
              drawingDataUrl={room.drawingDataUrl}
              disabled={!isDrawer || !isRoundActive}
              hint={canvasHint}
              onDrawingChange={handleDrawingChange}
            />
            {displayedError ? <p className="form__error">{displayedError}</p> : null}
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
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
              <div>
                <dt>Host</dt>
                <dd>{isHost ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Your Guess">
            <GuessForm
              disabled={!isRoundActive || isDrawer || isLoading}
              disabledReason={guessDisabledReason}
              onSubmit={handleGuess}
            />
          </Card>
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
