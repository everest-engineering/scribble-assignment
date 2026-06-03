import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import type { Point, RoomSnapshot, Stroke } from "../services/api";
import { useRoomState, useRoomStore } from "../state/roomStore";

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 420;

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
      return;
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room || (room.status !== "active" && room.status !== "result")) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      roomStore.fetchRoom().catch(() => undefined);
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [room, roomStore]);

  if (!room) {
    return null;
  }

  return (
    <GamePageView
      room={room}
      participantId={participantId}
      onExit={() => navigate("/lobby")}
      onDrawingChange={(strokes) => roomStore.updateDrawing(strokes)}
      onClearDrawing={() => roomStore.clearDrawing()}
      onSubmitGuess={(guess) => roomStore.submitGuess(guess)}
      onRestart={() => roomStore.restartRoom()}
    />
  );
}

interface GamePageViewProps {
  room: RoomSnapshot;
  participantId: string | null;
  onExit: () => void;
  onDrawingChange?: (strokes: Stroke[]) => Promise<unknown> | unknown;
  onClearDrawing?: () => Promise<unknown> | unknown;
  onSubmitGuess?: (guess: string) => Promise<unknown> | unknown;
  onRestart?: () => Promise<unknown> | unknown;
}

export function GamePageView({ room, participantId, onExit, onDrawingChange, onClearDrawing, onSubmitGuess, onRestart }: GamePageViewProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draftStrokes, setDraftStrokes] = useState<Stroke[]>(room.drawing.strokes);
  const [activeStrokeId, setActiveStrokeId] = useState<string | null>(null);
  const [drawingError, setDrawingError] = useState<string | null>(null);
  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((participant) => participant.id === room.drawerParticipantId) ?? null;
  const isDrawer = room.viewerRole === "drawer";
  const isActive = room.status === "active";
  const canDraw = isActive && isDrawer;
  const isResult = room.status === "result";
  const title = isResult ? "Round Complete" : isDrawer ? "Draw the Word" : "Guess the Word!";
  const statusLabel = isResult ? "Result" : isActive ? (isDrawer ? "Drawing" : "Guessing") : "Waiting";
  const visibleStrokes = useMemo(() => draftStrokes, [draftStrokes]);

  useEffect(() => {
    setDraftStrokes(room.drawing.strokes);
  }, [room.drawing.strokes]);

  function getCanvasPoint(event: ReactPointerEvent<SVGSVGElement>): Point {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * CANVAS_WIDTH,
      y: ((event.clientY - bounds.top) / bounds.height) * CANVAS_HEIGHT
    };
  }

  function syncDrawing(strokes: Stroke[]) {
    setDrawingError(null);
    void Promise.resolve(onDrawingChange?.(strokes)).catch((caughtError: unknown) => {
      setDrawingError(caughtError instanceof Error ? caughtError.message : "Unable to sync drawing");
    });
  }

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (!canDraw) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    const stroke: Stroke = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      points: [getCanvasPoint(event)]
    };
    const nextStrokes = [...draftStrokes, stroke];
    setActiveStrokeId(stroke.id);
    setDraftStrokes(nextStrokes);
    syncDrawing(nextStrokes);
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (!canDraw || !activeStrokeId) {
      return;
    }

    const nextStrokes = draftStrokes.map((stroke) =>
      stroke.id === activeStrokeId ? { ...stroke, points: [...stroke.points, getCanvasPoint(event)] } : stroke
    );
    setDraftStrokes(nextStrokes);
    syncDrawing(nextStrokes);
  }

  function handlePointerUp(event: ReactPointerEvent<SVGSVGElement>) {
    if (!activeStrokeId) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    setActiveStrokeId(null);
  }

  async function handleClearDrawing() {
    try {
      setDrawingError(null);
      setDraftStrokes([]);
      await onClearDrawing?.();
    } catch (caughtError) {
      setDrawingError(caughtError instanceof Error ? caughtError.message : "Unable to clear drawing");
    }
  }

  async function handleRestart() {
    await onRestart?.();
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">{title}</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard room={room} />
          <ResultPanel room={room} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <div className="drawing-board">
              <svg
                ref={svgRef}
                className={canDraw ? "drawing-board__canvas drawing-board__canvas--active" : "drawing-board__canvas"}
                viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
                role="img"
                aria-label="Shared drawing canvas"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#ffffff" />
                {visibleStrokes.map((stroke) => (
                  <path key={stroke.id} d={strokePath(stroke)} fill="none" stroke="#111827" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                ))}
              </svg>
              <div className="drawing-board__footer">
                <span className="placeholder-note">{isDrawer ? "Drawing controls active" : `${drawer?.name ?? "The drawer"} is drawing`}</span>
                <button className="button button--secondary" type="button" disabled={!canDraw} onClick={handleClearDrawing}>
                  Clear Canvas
                </button>
              </div>
              {drawingError ? <p className="form__error">{drawingError}</p> : null}
            </div>
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
                <dt>Drawer</dt>
                <dd>{drawer?.name ?? "Not assigned"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{statusLabel}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Word">
            {(isDrawer || isResult) && room.secretWord ? (
              <p className="secret-word">{room.secretWord}</p>
            ) : (
              <p className="placeholder-note">Hidden from guessers</p>
            )}
          </Card>

          <Card title="Your Guess">
            <GuessForm disabled={!isActive || isDrawer} onSubmitGuess={onSubmitGuess} />
          </Card>

          {isResult ? (
            <Card title="Result">
              <p className="placeholder-note">Final score recorded</p>
              <button className="button button--primary" type="button" disabled={!room.canRestart} onClick={handleRestart}>
                Restart Room
              </button>
            </Card>
          ) : null}
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={onExit}>
          Exit Game
        </button>
      </div>
    </section>
  );
}

function strokePath(stroke: Stroke) {
  if (stroke.points.length === 0) {
    return "";
  }

  const [firstPoint, ...remainingPoints] = stroke.points;
  return [`M ${firstPoint.x} ${firstPoint.y}`, ...remainingPoints.map((point) => `L ${point.x} ${point.y}`)].join(" ");
}
