import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import type { DrawingPoint, DrawingStroke } from "../services/api";
import { useRoomState, useRoomStore } from "../state/roomStore";

const CANVAS_HEIGHT = 520;
const DRAWING_COLOR = "#111827";
const DRAWING_SIZE = 5;

interface DrawingBoardProps {
  drawing: DrawingStroke[];
  isDrawer: boolean;
  drawerName: string | null;
  onDrawingChange: (drawing: DrawingStroke[]) => Promise<void>;
  onClear: () => Promise<void>;
}

function drawStrokes(canvas: HTMLCanvasElement, strokes: DrawingStroke[]) {
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, rect.width, CANVAS_HEIGHT);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, rect.width, CANVAS_HEIGHT);
  context.lineCap = "round";
  context.lineJoin = "round";

  strokes.forEach((stroke) => {
    if (stroke.points.length === 0) {
      return;
    }

    context.beginPath();
    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.size;
    const [firstPoint, ...restPoints] = stroke.points;
    context.moveTo(firstPoint.x * rect.width, firstPoint.y * CANVAS_HEIGHT);
    restPoints.forEach((point) => {
      context.lineTo(point.x * rect.width, point.y * CANVAS_HEIGHT);
    });
    context.stroke();
  });
}

function DrawingBoard({ drawing, isDrawer, drawerName, onDrawingChange, onClear }: DrawingBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const drawingRef = useRef<DrawingStroke[]>(drawing);
  const [localDrawing, setLocalDrawing] = useState<DrawingStroke[]>(drawing);

  function setDrawing(nextDrawing: DrawingStroke[]) {
    drawingRef.current = nextDrawing;
    setLocalDrawing(nextDrawing);
  }

  useEffect(() => {
    if (!isDrawingRef.current) {
      setDrawing(drawing);
    }
  }, [drawing]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    function resizeCanvas() {
      if (!canvas) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * pixelRatio));
      canvas.height = Math.floor(CANVAS_HEIGHT * pixelRatio);
      drawStrokes(canvas, drawingRef.current);
    }

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      drawStrokes(canvasRef.current, localDrawing);
    }
  }, [localDrawing]);

  function pointFromEvent(event: PointerEvent<HTMLCanvasElement>): DrawingPoint {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / CANVAS_HEIGHT));
    return { x, y };
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    const stroke: DrawingStroke = {
      id: crypto.randomUUID(),
      color: DRAWING_COLOR,
      size: DRAWING_SIZE,
      points: [pointFromEvent(event)]
    };
    setDrawing([...drawingRef.current, stroke]);
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer || !isDrawingRef.current) {
      return;
    }

    const point = pointFromEvent(event);
    const nextDrawing = drawingRef.current.map((stroke, index) =>
      index === drawingRef.current.length - 1 ? { ...stroke, points: [...stroke.points, point] } : stroke
    );
    setDrawing(nextDrawing);
  }

  async function handlePointerUp(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer || !isDrawingRef.current) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    isDrawingRef.current = false;
    await onDrawingChange(drawingRef.current);
  }

  async function handleClear() {
    setDrawing([]);
    await onClear();
  }

  return (
    <div className="drawing-board">
      <canvas
        ref={canvasRef}
        className={isDrawer ? "drawing-board__canvas" : "drawing-board__canvas drawing-board__canvas--readonly"}
        style={{ height: CANVAS_HEIGHT }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <div className="drawing-board__toolbar">
        <span>{drawerName ? `${drawerName} is drawing now.` : "Assigning drawer..."}</span>
        {isDrawer ? (
          <button className="button button--secondary" type="button" onClick={handleClear}>
            Clear Canvas
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, isLoading, error } = useRoomState();
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
    if (!room) {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        await roomStore.fetchRoom();
      } catch (caughtError) {
        console.error("Game polling error:", caughtError);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [room, roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((participant) => participant.id === room.drawerId) ?? null;
  const isDrawer = participantId !== null && participantId === room.drawerId;
  const isHost = participantId !== null && participantId === room.hostId;
  const isResults = room.status === "results";

  async function handleDrawingChange(nextDrawing: DrawingStroke[]) {
    try {
      setActionError(null);
      await roomStore.updateDrawing(nextDrawing);
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

  async function handleGuessSubmit(guess: string) {
    setActionError(null);
    await roomStore.submitGuess(guess);
  }

  async function handleEndRound() {
    try {
      setActionError(null);
      await roomStore.endRound();
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to end round");
    }
  }

  async function handleRestartRoom() {
    try {
      setActionError(null);
      await roomStore.restartRoom();
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to restart room");
    }
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">{isResults ? "Round complete" : "Round 1"}</span>
          <h1 className="game-page__title">{isResults ? "Results" : "Guess the Word!"}</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      {isResults ? (
        <div className="result-summary">
          <Card title="Correct Word">
            <p className="result-summary__word">{room.secretWord ?? "Unknown"}</p>
            <p>Final scores and every guess from this round are visible to everyone.</p>
          </Card>
          <Card title="Next">
            {isHost ? (
              <div className="result-summary__actions">
                <p>Restart returns everyone to the lobby and clears this round.</p>
                <button className="button button--primary" disabled={isLoading} onClick={handleRestartRoom}>
                  Restart to Lobby
                </button>
              </div>
            ) : (
              <p>Waiting for the host to restart the room.</p>
            )}
          </Card>
        </div>
      ) : null}

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} scores={room.scores} />
          <ResultPanel guesses={room.guesses} />
        </aside>

        <div className="game-page__main">
          {!isResults ? (
            <Card title="Canvas">
              <DrawingBoard
                drawing={room.drawing}
                isDrawer={isDrawer}
                drawerName={drawer?.name ?? null}
                onDrawingChange={handleDrawingChange}
                onClear={handleClearDrawing}
              />
            </Card>
          ) : null}
          {error ?? actionError ? <p className="form__error">{error ?? actionError}</p> : null}
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title={isResults ? "Round Summary" : isDrawer ? "You are the Drawer" : "You are a Guesser"}>
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Drawer</dt>
                <dd>{drawer?.name ?? "Assigning drawer..."}</dd>
              </div>
              <div>
                <dt>Secret word</dt>
                <dd>{isResults || isDrawer ? room.secretWord ?? "Choosing word..." : "Hidden"}</dd>
              </div>
            </dl>
          </Card>

          {!isResults && !isDrawer ? (
            <Card title="Your Guess">
              <GuessForm disabled={isLoading} onSubmit={handleGuessSubmit} />
            </Card>
          ) : null}

          {!isResults && isHost ? (
            <Card title="Host Controls">
              <button className="button button--primary" disabled={isLoading} onClick={handleEndRound}>
                End Round
              </button>
            </Card>
          ) : null}
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
