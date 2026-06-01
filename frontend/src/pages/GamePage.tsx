import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import type { RoomSnapshot } from "../services/api";
import { GAME_POLL_MS, useRoomPolling, useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading } = useRoomState();
  const [actionError, setActionError] = useState<string | null>(null);

  useRoomPolling(Boolean(room && room.status !== "lobby"), GAME_POLL_MS);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room]);

  if (!room || !participantId) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isPlaying = room.status === "playing";
  const isResult = room.status === "result";

  async function handleDrawingChange(strokes: RoomSnapshot["strokes"]) {
    try {
      setActionError(null);
      await roomStore.updateDrawing(strokes);
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error ? caughtError.message : "Unable to sync drawing"
      );
    }
  }

  async function handleClearCanvas() {
    try {
      setActionError(null);
      await roomStore.clearDrawing();
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error ? caughtError.message : "Unable to clear canvas"
      );
    }
  }

  async function handleGuess(text: string) {
    await roomStore.submitGuess(text);
  }

  async function handleRestart() {
    try {
      setActionError(null);
      await roomStore.restartGame();
      navigate("/lobby");
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error ? caughtError.message : "Unable to restart the game"
      );
    }
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">
            {isResult ? "Round complete" : isPlaying ? "Round in progress" : "Game"}
          </span>
          <h1 className="game-page__title">
            {room.isDrawer ? "You are drawing" : "Guess the Word!"}
          </h1>
          {room.isDrawer && room.secretWord ? (
            <p className="game-page__secret-word">
              Secret word: <strong>{room.secretWord}</strong>
            </p>
          ) : null}
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} />
          <ResultPanel guesses={room.guesses} correctWord={room.correctWord} status={room.status} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <DrawingCanvas
              strokes={room.strokes}
              canDraw={isPlaying && room.isDrawer}
              onStrokesChange={handleDrawingChange}
            />
            {room.isDrawer && isPlaying ? (
              <div className="button-row button-row--compact">
                <button className="button button--secondary" type="button" onClick={handleClearCanvas}>
                  Clear Canvas
                </button>
              </div>
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
                <dt>Role</dt>
                <dd>
                  {room.isDrawer ? "Drawer" : room.isHost ? "Host (Guesser)" : "Guesser"}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Your Guess">
            <GuessForm
              disabled={!isPlaying || room.isDrawer}
              onSubmitGuess={handleGuess}
            />
          </Card>
        </aside>
      </div>

      {(error || actionError) && <p className="form__error">{error ?? actionError}</p>}

      <div className="button-row">
        {isResult && room.isHost ? (
          <button className="button button--primary" disabled={isLoading} onClick={handleRestart}>
            Restart to Lobby
          </button>
        ) : null}
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Back to Lobby
        </button>
      </div>
    </section>
  );
}
