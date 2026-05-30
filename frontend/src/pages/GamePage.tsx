import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import type { StrokeInput } from "../services/api";
import { useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL_MS = 2000;

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [pollError, setPollError] = useState<string | null>(null);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room || (room.status !== "playing" && room.status !== "result")) {
      return;
    }

    const intervalId = window.setInterval(async () => {
      try {
        setPollError(null);
        await roomStore.fetchRoomSilent();
      } catch (caughtError) {
        setPollError(
          caughtError instanceof Error ? caughtError.message : "Unable to refresh game"
        );
      }
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [room, room?.code, room?.status, roomStore]);

  const handleStrokeComplete = useCallback(
    async (stroke: StrokeInput) => {
      setCanvasError(null);

      try {
        await roomStore.addStroke(stroke);
      } catch (caughtError) {
        const message =
          caughtError instanceof Error ? caughtError.message : "Unable to save stroke";
        setCanvasError(message);
        throw caughtError;
      }
    },
    [roomStore]
  );

  const handleClearCanvas = useCallback(async () => {
    setCanvasError(null);

    try {
      await roomStore.clearCanvas();
    } catch (caughtError) {
      setCanvasError(
        caughtError instanceof Error ? caughtError.message : "Unable to clear canvas"
      );
    }
  }, [roomStore]);

  const handleSubmitGuess = useCallback(
    async (guessText: string) => {
      await roomStore.submitGuess(guessText);
    },
    [roomStore]
  );

  const handleEndRound = useCallback(async () => {
    setActionError(null);

    try {
      await roomStore.endRoom();
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error ? caughtError.message : "Unable to end round"
      );
    }
  }, [roomStore]);

  const handleRestart = useCallback(async () => {
    setActionError(null);

    try {
      await roomStore.restartRoom();
      navigate("/lobby", { replace: true });
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error ? caughtError.message : "Unable to restart"
      );
    }
  }, [navigate, roomStore]);

  if (!room || room.status === "lobby") {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer =
    room.participants.find((participant) => participant.role === "drawer") ?? null;
  const isDrawer = viewer?.role === "drawer";
  const isHost = viewer?.isHost ?? false;
  const isPlaying = room.status === "playing";
  const isResult = room.status === "result";
  const strokes = room.strokes ?? [];
  const guesses = room.guesses ?? [];
  const showSecretWord = (isPlaying && isDrawer && room.secretWord) || (isResult && room.secretWord);

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">
            {isResult ? "Round Results" : "Guess the Word!"}
          </h1>
          <p className="game-page__status">
            {isResult ? "Round ended — review the results below" : `Round active — ${room.status}`}
          </p>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      {pollError ? <p className="form__error">{pollError}</p> : null}
      {canvasError ? <p className="form__error">{canvasError}</p> : null}
      {actionError ? <p className="form__error">{actionError}</p> : null}

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} />
          <ResultPanel guesses={guesses} />
        </aside>

        {isPlaying ? (
          <div className="game-page__main">
            <Card title="Canvas">
              <DrawingCanvas
                strokes={strokes}
                canDraw={isDrawer}
                onStrokeComplete={handleStrokeComplete}
              />
              {isDrawer ? (
                <div className="button-row button-row--compact" style={{ marginTop: "8px" }}>
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={handleClearCanvas}
                  >
                    Clear Canvas
                  </button>
                </div>
              ) : null}
            </Card>
          </div>
        ) : (
          <div className="game-page__main">
            <Card title="Round Complete">
              <p>The round has ended. The correct word and final scores are shown below.</p>
            </Card>
          </div>
        )}

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Your role</dt>
                <dd>{viewer?.role ?? "Unknown"}</dd>
              </div>
              <div>
                <dt>Drawer</dt>
                <dd>{drawer?.name ?? "Unknown"}</dd>
              </div>
            </dl>
          </Card>

          {showSecretWord ? (
            <Card title={isResult ? "Correct Word" : "Secret Word"}>
              <p className="secret-word">{room.secretWord}</p>
            </Card>
          ) : null}

          {isPlaying && !isDrawer ? (
            <Card title="Your Guess">
              <p style={{ marginBottom: "8px" }}>Watch the drawing and guess the word.</p>
              <GuessForm onSubmitGuess={handleSubmitGuess} />
            </Card>
          ) : null}
        </aside>
      </div>

      <div className="button-row">
        {isPlaying && isHost ? (
          <button className="button button--primary" type="button" onClick={handleEndRound}>
            End Round
          </button>
        ) : null}
        {isResult && isHost ? (
          <button className="button button--primary" type="button" onClick={handleRestart}>
            Restart to Lobby
          </button>
        ) : null}
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
