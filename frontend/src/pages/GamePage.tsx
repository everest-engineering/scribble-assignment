import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { PageHeader } from "../components/PageHeader";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

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
    if (!room) return;

    const pollingRef = setInterval(() => {
      roomStore.fetchRoom();
    }, 2000);

    return () => clearInterval(pollingRef);
  }, [room, roomStore]);

  useEffect(() => {
    if (!isDrawing) {
      lastPos.current = null;
    }
  }, [isDrawing]);

  function getCanvasPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    setIsDrawing(true);
    lastPos.current = getCanvasPos(e);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas || !lastPos.current) return;

    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
    lastPos.current = pos;
  }

  function handleMouseUp() {
    setIsDrawing(false);
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((participant) => participant.id === room.drawerId) ?? null;
  const isDrawer = viewer?.id === room.drawerId;
  const isFinished = room.status === "finished";
  const isHost = viewer?.isHost ?? false;

  async function handleRestart() {
    try {
      await roomStore.restartGame();
      navigate("/lobby");
    } catch (e) {
      // error handled by store
    }
  }

  if (isFinished) {
    return (
      <section className="panel placeholder-page">
        <div className="lobby-header">
          <PageHeader
            kicker="Round Over"
            title="Results"
            description={`The word was: ${room.secretWord}`}
          />
          <RoomCodeBadge code={room.code} />
        </div>

        <div className="summary-grid">
          <Scoreboard />
          <ResultPanel />
        </div>

        <div className="button-row button-row--spread">
          <button className="button button--secondary" onClick={() => navigate("/")}>
            Exit to Home
          </button>
          {isHost ? (
            <button className="button button--primary" onClick={handleRestart}>
              Play Again
            </button>
          ) : (
            <button className="button button--secondary" disabled>
              Waiting for host...
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {room.round}</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Card title="Drawer">
            <p style={{ fontWeight: 600 }}>{drawer?.name ?? "Unknown"}</p>
          </Card>
          {isDrawer && room.secretWord && (
            <Card title="Your Word">
              <p style={{ fontSize: "1.25rem", fontWeight: 700, textAlign: "center" }}>
                {room.secretWord}
              </p>
            </Card>
          )}
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <canvas
              ref={canvasRef}
              width={600}
              height={400}
              style={{
                width: "100%",
                height: "auto",
                aspectRatio: "600 / 400",
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                cursor: isDrawer ? "crosshair" : "default",
                touchAction: "none"
              }}
              onMouseDown={isDrawer ? handleMouseDown : undefined}
              onMouseMove={isDrawer ? handleMouseMove : undefined}
              onMouseUp={isDrawer ? handleMouseUp : undefined}
              onMouseLeave={isDrawer ? handleMouseUp : undefined}
            />
            {isDrawer && (
              <div className="button-row" style={{ marginTop: "8px" }}>
                <button className="button button--secondary" type="button" onClick={handleClear}>
                  Clear Canvas
                </button>
              </div>
            )}
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
            </dl>
          </Card>

          <Card title="Your Guess">
            <GuessForm disabled={isDrawer} />
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
