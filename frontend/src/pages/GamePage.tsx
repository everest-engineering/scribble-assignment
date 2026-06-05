import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<Array<{ x: number; y: number }>>([]);
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    } else if (room.status === "result") {
      navigate("/result");
    }
  }, [navigate, room?.status]);

  useEffect(() => {
    if (!room) return;
    const id = setInterval(async () => {
      try {
        await roomStore.fetchRoom();
        setPollError(null);
      } catch (err) {
        setPollError(err instanceof Error ? err.message : "Unable to refresh");
      }
    }, 2000);
    return () => clearInterval(id);
  }, [room?.code]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!room?.canvasStrokes?.length) return;
    ctx.strokeStyle = "#1e1b4b";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of room.canvasStrokes) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    }
  }, [room?.canvasStrokes]);

  if (!room) return null;

  const viewer = room.participants.find((p) => p.id === participantId) ?? null;
  const drawer = room.participants.find((p) => p.id === room.drawerId) ?? null;
  const isDrawer = participantId === room.drawerId;
  const isHost = participantId === room.hostId;

  function getPoint(event: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function handleMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawer) return;
    isDrawingRef.current = true;
    const pt = getPoint(event);
    currentStrokeRef.current = [pt];
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = "#1e1b4b";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
    }
  }

  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawer || !isDrawingRef.current) return;
    const pt = getPoint(event);
    currentStrokeRef.current.push(pt);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    }
  }

  async function handleMouseUp() {
    if (!isDrawer || !isDrawingRef.current) return;
    isDrawingRef.current = false;
    const points = currentStrokeRef.current;
    currentStrokeRef.current = [];
    if (points.length >= 2) {
      await roomStore.addStroke(points);
    }
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">
            {drawer ? `${drawer.name} is drawing` : "Guess the Word!"}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      {isDrawer && room.currentWord ? (
        <p style={{ margin: "0 0 8px", padding: "8px 12px", backgroundColor: "#dcfce7", borderRadius: "6px", fontWeight: 600 }}>
          Secret word: {room.currentWord}
        </p>
      ) : null}

      {pollError ? (
        <p className="form__error" style={{ marginBottom: "8px" }}>{pollError}</p>
      ) : null}

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <canvas
              ref={canvasRef}
              width={560}
              height={420}
              style={{
                display: "block",
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                cursor: isDrawer ? "crosshair" : "default",
                touchAction: "none"
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            {isDrawer ? (
              <div style={{ marginTop: "8px" }}>
                <button
                  className="button button--secondary"
                  onClick={() => roomStore.clearCanvas()}
                >
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
              {drawer ? (
                <div>
                  <dt>Drawing</dt>
                  <dd>
                    {drawer.name}
                    {isDrawer ? " (you)" : ""}
                  </dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <Card title="Your Guess">
            <GuessForm />
          </Card>
        </aside>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
        {isHost ? (
          <button className="button button--primary" onClick={() => roomStore.endRound()}>
            End Round
          </button>
        ) : null}
      </div>
    </section>
  );
}
