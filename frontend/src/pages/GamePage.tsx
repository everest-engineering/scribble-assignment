import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import type { DrawingPoint, DrawingState, DrawingStroke } from "../services/api";
import { useRoomState, useRoomStore } from "../state/roomStore";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

function drawStrokes(canvas: HTMLCanvasElement, drawing: DrawingState) {
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 4;
  context.strokeStyle = "#111827";

  drawing.strokes.forEach((stroke) => {
    if (stroke.points.length === 0) {
      return;
    }

    context.beginPath();
    context.moveTo(stroke.points[0].x, stroke.points[0].y);

    stroke.points.slice(1).forEach((point) => {
      context.lineTo(point.x, point.y);
    });

    context.stroke();
  });
}

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeStrokeRef = useRef<DrawingStroke | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room || (room.status !== "playing" && room.status !== "result")) {
      return undefined;
    }

    let isActive = true;
    let isPolling = false;

    const pollRoom = async () => {
      if (isPolling) {
        return;
      }

      try {
        isPolling = true;
        const nextRoom = await roomStore.fetchRoom();

        if (nextRoom?.status === "lobby" && isActive) {
          navigate("/lobby", { replace: true });
        }
      } catch (caughtError) {
        if (isActive) {
          setActionError(caughtError instanceof Error ? caughtError.message : "Unable to refresh game");
        }
      } finally {
        isPolling = false;
      }
    };

    const intervalId = window.setInterval(() => {
      void pollRoom();
    }, 2000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [navigate, room?.code, room?.status, roomStore]);

  useEffect(() => {
    if (canvasRef.current && room?.drawing) {
      drawStrokes(canvasRef.current, room.drawing);
    }
  }, [room?.drawing]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = Boolean(participantId && room.drawerParticipantId === participantId);
  const drawerLabel = room.drawerName ?? "Waiting for drawer";
  const canDraw = isDrawer && room.status === "playing";
  const isResult = room.status === "result";

  function getCanvasPoint(event: PointerEvent<HTMLCanvasElement>): DrawingPoint {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT
    };
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!canDraw) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    activeStrokeRef.current = {
      points: [getCanvasPoint(event)]
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!canDraw || !activeStrokeRef.current) {
      return;
    }

    const point = getCanvasPoint(event);
    const stroke = activeStrokeRef.current;
    stroke.points.push(point);

    const previousPoint = stroke.points[stroke.points.length - 2];
    const context = event.currentTarget.getContext("2d");

    if (!context || !previousPoint) {
      return;
    }

    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 4;
    context.strokeStyle = "#111827";
    context.beginPath();
    context.moveTo(previousPoint.x, previousPoint.y);
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  async function handlePointerUp(event: PointerEvent<HTMLCanvasElement>) {
    if (!canDraw || !activeStrokeRef.current) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    const stroke = activeStrokeRef.current;
    activeStrokeRef.current = null;

    if (stroke.points.length < 2) {
      return;
    }

    try {
      setActionError(null);
      await roomStore.updateDrawing({
        strokes: [...(room?.drawing.strokes ?? []), stroke]
      });
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to update drawing");
    }
  }

  async function handleClearDrawing() {
    try {
      setActionError(null);
      await roomStore.clearDrawing();
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to clear canvas");
    }
  }

  async function handleSubmitGuess(guessText: string) {
    setActionError(null);
    await roomStore.submitGuess(guessText);
  }

  async function handleRestartGame() {
    try {
      setActionError(null);
      const nextRoom = await roomStore.restartGame();

      if (nextRoom.status === "lobby") {
        navigate("/lobby", { replace: true });
      }
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to restart room");
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
          <Scoreboard scores={room.scores} />
          <ResultPanel correctWord={isResult ? room.correctWord : null} guesses={room.guesses} />
        </aside>

        <div className="game-page__main">
          <Card
            title="Canvas"
            footer={
              canDraw ? (
                <button className="button button--secondary" onClick={handleClearDrawing} type="button">
                  Clear Canvas
                </button>
              ) : null
            }
          >
            <canvas
              aria-label="Drawing canvas"
              className="drawing-canvas"
              height={CANVAS_HEIGHT}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              ref={canvasRef}
              width={CANVAS_WIDTH}
            />
            <p className="placeholder-note">
              {canDraw
                ? "You are drawing."
                : room.drawerName
                  ? `${room.drawerName} is drawing.`
                  : "Waiting for drawer."}
            </p>
            {actionError ? <p className="form__error">{actionError}</p> : null}
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
                <dd>{isResult ? "Result" : "Playing"}</dd>
              </div>
              <div>
                <dt>Drawer</dt>
                <dd>{drawerLabel}</dd>
              </div>
              <div>
                <dt>Your role</dt>
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
            </dl>
          </Card>

          {isResult ? (
            <Card title="Result">
              <dl className="detail-list">
                <div>
                  <dt>Correct word</dt>
                  <dd>{room.correctWord ?? "Unknown"}</dd>
                </div>
                <div>
                  <dt>Round status</dt>
                  <dd>{room.isHost ? "Ready to restart" : "Waiting for host"}</dd>
                </div>
              </dl>
              {room.isHost ? (
                <button className="button button--primary" onClick={handleRestartGame} type="button">
                  Restart Game
                </button>
              ) : null}
            </Card>
          ) : null}

          <Card title="Secret Word">
            {isResult ? (
              <p className="placeholder-note">Round complete.</p>
            ) : isDrawer && room.secretWord ? (
              <p className="placeholder-note">{room.secretWord}</p>
            ) : (
              <p>{room.drawerName ? `${room.drawerName} knows the word.` : "The word appears when the round starts."}</p>
            )}
          </Card>

          <Card title="Your Guess">
            <GuessForm disabled={isDrawer || room.status !== "playing"} onSubmitGuess={handleSubmitGuess} />
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
