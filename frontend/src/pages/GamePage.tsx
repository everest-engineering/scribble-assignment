import { useCallback, useEffect, useRef, type PointerEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";
import type { DrawingStroke, Point } from "../services/api";

export function GamePage() {
  const navigate = useNavigate();
  const { room, participantId } = useRoomState();
  const roomStore = useRoomStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const activeStrokeRef = useRef<Point[]>([]);

  const drawScene = useCallback(
    (strokes: DrawingStroke[], activePoints: Point[] = []) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);

      const renderStroke = (points: Point[]) => {
        if (points.length === 0) {
          return;
        }

        context.strokeStyle = "#111827";
        context.lineWidth = 4;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        for (let index = 1; index < points.length; index += 1) {
          context.lineTo(points[index].x, points[index].y);
        }

        context.stroke();
      };

      for (const stroke of strokes) {
        renderStroke(stroke.points);
      }

      if (activePoints.length > 0) {
        renderStroke(activePoints);
      }
    },
    []
  );

  const toCanvasPoint = useCallback((event: PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height
    };
  }, []);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        await roomStore.fetchRoom(true);
      } catch (caughtError) {
        console.error("Polling fetchRoom failed in GamePage:", caughtError);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [navigate, room, roomStore]);

  if (!room) {
    return null;
  }

  const activeRoom = room;

  const viewer = activeRoom.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = activeRoom.drawerId === participantId;
  const isHost = activeRoom.hostId === participantId;
  const inResults = activeRoom.status === "results";
  const canViewGuessHistory = inResults;
  const drawerName = activeRoom.participants.find((p) => p.id === activeRoom.drawerId)?.name ?? "Someone";

  useEffect(() => {
    drawScene(activeRoom.drawing);
  }, [activeRoom.drawing, drawScene]);

  async function handleClearCanvas() {
    if (!isDrawer) {
      return;
    }

    try {
      await roomStore.clearDrawing();
    } catch (error) {
      console.error("Clear drawing failed:", error);
    }
  }

  async function handleRestartGame() {
    if (!isHost || !inResults) {
      return;
    }

    try {
      await roomStore.restartGame();
      navigate("/lobby", { replace: true });
    } catch (error) {
      console.error("Restart game failed:", error);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer) {
      return;
    }

    isDrawingRef.current = true;
    activeStrokeRef.current = [toCanvasPoint(event)];
    event.currentTarget.setPointerCapture(event.pointerId);
    drawScene(activeRoom.drawing, activeStrokeRef.current);
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer || !isDrawingRef.current) {
      return;
    }

    activeStrokeRef.current = [...activeStrokeRef.current, toCanvasPoint(event)];
    drawScene(activeRoom.drawing, activeStrokeRef.current);
  }

  async function finishStroke() {
    if (!isDrawer || !isDrawingRef.current) {
      return;
    }

    isDrawingRef.current = false;
    const completedPoints = [...activeStrokeRef.current];
    activeStrokeRef.current = [];

    if (completedPoints.length < 2) {
      drawScene(activeRoom.drawing);
      return;
    }

    const nextDrawing = [...activeRoom.drawing, { points: completedPoints }];
    drawScene(nextDrawing);

    try {
      await roomStore.updateDrawing(nextDrawing);
    } catch (error) {
      console.error("Update drawing failed:", error);
      drawScene(activeRoom.drawing);
    }
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">{inResults ? "Round Complete" : "Round 1"}</span>
          <h1 className="game-page__title">{inResults ? "Results" : "Guess the Word!"}</h1>
        </div>
        <RoomCodeBadge code={activeRoom.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard sortByScore={inResults} />
          <ResultPanel showGuesses={canViewGuessHistory} />
        </aside>

        <div className="game-page__main">
          {inResults ? (
            <Card title="Round Summary">
              <p className="results-word-label">Correct Word</p>
              <p className="results-word-value">{activeRoom.secretWord ?? "(Unavailable)"}</p>
              <p className="canvas-caption">Final scores and complete guess history are shown on the left.</p>
            </Card>
          ) : (
            <Card title={isDrawer ? `Canvas - Draw "${activeRoom.secretWord || ""}"` : "Canvas"}>
              <div className="canvas-stage">
                <canvas
                  className={`game-canvas ${isDrawer ? "game-canvas--interactive" : ""}`}
                  ref={canvasRef}
                  width={1100}
                  height={520}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={finishStroke}
                  onPointerLeave={finishStroke}
                />
              </div>
              <p className="canvas-caption">
                {isDrawer
                  ? `You are drawing: ${activeRoom.secretWord ?? ""}`
                  : `${drawerName} is drawing. Submit your guesses on the right.`}
              </p>
              {isDrawer ? (
                <div className="button-row button-row--compact">
                  <button className="button button--secondary" type="button" onClick={handleClearCanvas}>
                    Clear Canvas
                  </button>
                </div>
              ) : null}
            </Card>
          )}
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
                <dd><strong>{isDrawer ? "Drawer" : "Guesser"}</strong></dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{inResults ? "Results" : "Playing"}</dd>
              </div>
            </dl>
          </Card>

          {inResults ? (
            <Card title="Next Round">
              {isHost ? (
                <div className="button-row button-row--compact">
                  <button className="button button--primary" type="button" onClick={handleRestartGame}>
                    Restart Game
                  </button>
                </div>
              ) : (
                <p className="status-line">Waiting for host to restart...</p>
              )}
            </Card>
          ) : (
            <Card title="Your Guess">
              <GuessForm />
            </Card>
          )}
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
