import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

interface Point {
  x: number;
  y: number;
}

type Stroke = Point[];

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeRef = useRef<Stroke>([]);
  const allStrokesRef = useRef<Stroke[]>([]);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
      return;
    }

    const interval = setInterval(async () => {
      try {
        await roomStore.fetchRoom();
      } catch (e) {
        console.error("Polling failed", e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [navigate, room, roomStore]);

  // Sync canvas with room data
  useEffect(() => {
    if (!canvasRef.current || !room) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let strokes: Stroke[] = [];
    try {
      if (room.canvasData) {
        strokes = JSON.parse(room.canvasData);
      }
    } catch (e) {
      console.error("Failed to parse canvas data", e);
    }

    // Only update if strokes have changed and we're not currently drawing (to prevent flickering for drawer)
    if (!isDrawing) {
      drawStrokes(ctx, strokes, canvas.width, canvas.height);
      allStrokesRef.current = strokes;
    }
  }, [room?.canvasData, isDrawing]);

  function drawStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[], width: number, height: number) {
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;

    strokes.forEach((stroke) => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    });
  }

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = room.isDrawer;

  function getMousePos(e: React.MouseEvent | React.TouchEvent) {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    // Scale coordinates to match internal canvas resolution
    return {
      x: (clientX - rect.left) * (canvasRef.current.width / rect.width),
      y: (clientY - rect.top) * (canvasRef.current.height / rect.height)
    };
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer) return;
    setIsDrawing(true);
    const pos = getMousePos(e);
    currentStrokeRef.current = [pos];
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isDrawer || !canvasRef.current) return;
    const pos = getMousePos(e);
    currentStrokeRef.current.push(pos);

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      const prevPos = currentStrokeRef.current[currentStrokeRef.current.length - 2];
      ctx.beginPath();
      ctx.moveTo(prevPos.x, prevPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const stopDrawing = async () => {
    if (!isDrawing || !isDrawer) return;
    setIsDrawing(false);
    if (currentStrokeRef.current.length > 1) {
      allStrokesRef.current.push(currentStrokeRef.current);
      try {
        await roomStore.draw(JSON.stringify(allStrokesRef.current));
      } catch (e) {
        console.error("Failed to save drawing", e);
      }
    }
    currentStrokeRef.current = [];
  };

  async function handleClear() {
    if (!isDrawer) return;
    allStrokesRef.current = [];
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    try {
      await roomStore.draw("");
    } catch (e) {
      console.error("Clear failed", e);
    }
  }

  async function handleEndRound() {
    try {
      await roomStore.endRound();
    } catch (e) {
      console.error("End round failed", e);
    }
  }

  const isHost = room.hostId === participantId;
  const isResult = room.status === "result";

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">
            {isResult
              ? "Round Over"
              : isDrawer
              ? "You are the Drawer"
              : "You are a Guesser"} — Round 1
          </span>
          <h1 className="game-page__title">
            {isResult
              ? `The word was: ${room.secretWord}`
              : isDrawer
              ? `Draw: ${room.secretWord}`
              : "Guess the Word!"}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
        </aside>

        <div className="game-page__main">
          {isResult ? (
            <ResultPanel />
          ) : (
            <>
              <Card title="Canvas">
                <div
                  className="canvas-container"
                  style={{
                    minHeight: "500px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    position: "relative",
                    cursor: isDrawer ? "crosshair" : "default"
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={500}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{ width: "100%", height: "100%", display: "block" }}
                  />
                  {!isDrawer && room.canvasData === "" && (
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "#6b7280" }}>
                      Waiting for the drawer to start...
                    </div>
                  )}
                </div>
                {isDrawer && (
                  <div className="button-row" style={{ marginTop: "16px" }}>
                    <button className="button button--secondary" onClick={handleClear}>
                      Clear Canvas
                    </button>
                  </div>
                )}
              </Card>

              <Card title="Guess History">
                {room.guesses.length === 0 ? (
                  <p>No guesses yet.</p>
                ) : (
                  <ul className="player-list">
                    {[...room.guesses].reverse().map((guess, index) => (
                      <li
                        key={index}
                        style={{
                          borderLeft: guess.isCorrect ? "4px solid #10b981" : "4px solid #ef4444",
                          paddingLeft: "8px"
                        }}
                      >
                        <strong>{guess.playerName}:</strong> {guess.text}
                        {guess.isCorrect && (
                          <span style={{ color: "#059669", marginLeft: "8px" }}>(Correct!)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </>
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
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
            </dl>
          </Card>

          {!isDrawer && !isResult && (
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
        {isHost && !isResult && (
          <button className="button button--primary" onClick={handleEndRound}>
            End Round
          </button>
        )}
      </div>
    </section>
  );
}
