import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

type Point = { x: number; y: number };
type Stroke = Point[];

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 500;
const DRAW_COLOR = "#111827";
const DRAW_WIDTH = 3;

function renderStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[]) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = DRAW_COLOR;
  ctx.lineWidth = DRAW_WIDTH;

  for (const stroke of strokes) {
    if (stroke.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i].x, stroke[i].y);
    }
    ctx.stroke();
  }
}

function parseDrawingData(data: string): Stroke[] {
  try {
    return JSON.parse(data) as Stroke[];
  } catch {
    return [];
  }
}

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const currentStroke = useRef<Stroke>([]);
  const strokesRef = useRef<Stroke[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (room) {
      roomStore.startPolling(2000);
    }
    return () => {
      roomStore.stopPolling();
    };
  }, [room, roomStore]);

  useEffect(() => {
    if (!room || !canvasRef.current) return;
    const strokes = parseDrawingData(room.drawingData);
    strokesRef.current = strokes;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) renderStrokes(ctx, strokes);
  }, [room?.drawingData, room]);

  const isDrawer = participantId === room?.drawerId;
  const isFinished = room?.status === "finished";

  const getCanvasPos = useCallback((event: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }, []);

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawer || isFinished) return;
    isDrawing.current = true;
    const pos = getCanvasPos(event);
    currentStroke.current = [pos];
  }, [isDrawer, isFinished, getCanvasPos]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !isDrawer) return;
    const pos = getCanvasPos(event);
    currentStroke.current.push(pos);

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const stroke = currentStroke.current;
    if (stroke.length < 2) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = DRAW_COLOR;
    ctx.lineWidth = DRAW_WIDTH;
    ctx.beginPath();
    ctx.moveTo(stroke[stroke.length - 2].x, stroke[stroke.length - 2].y);
    ctx.lineTo(stroke[stroke.length - 1].x, stroke[stroke.length - 1].y);
    ctx.stroke();
  }, [isDrawer, getCanvasPos]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (currentStroke.current.length > 0) {
      strokesRef.current.push([...currentStroke.current]);
      currentStroke.current = [];

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        roomStore.saveDrawing(JSON.stringify(strokesRef.current)).catch(() => {});
      }, 300);
    }
  }, [roomStore]);

  const handleClear = useCallback(async () => {
    if (!isDrawer) return;
    strokesRef.current = [];
    currentStroke.current = [];
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    await roomStore.clearDrawing();
  }, [isDrawer, roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {room.round}</span>
          <h1 className="game-page__title">{isFinished ? "Round Over!" : "Guess the Word!"}</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      {isFinished ? (
        <div className="word-banner">
          The word was: <strong>{room.secretWord}</strong>
        </div>
      ) : isDrawer && room.secretWord ? (
        <div className="word-banner">
          Your word: <strong>{room.secretWord}</strong>
        </div>
      ) : (
        <div className="word-banner word-banner--muted">
          Waiting for drawer to start drawing...
        </div>
      )}

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              style={{
                width: "100%",
                maxWidth: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                cursor: isDrawer ? "crosshair" : "default",
                display: "block",
                margin: "0 auto",
                backgroundColor: "#ffffff"
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            {isDrawer ? (
              <div className="button-row" style={{ marginTop: "12px" }}>
                <button className="button button--secondary" onClick={handleClear}>
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
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{isFinished ? "Finished" : "Playing"}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Your Guess">
            <GuessForm disabled={isDrawer || isFinished} />
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
