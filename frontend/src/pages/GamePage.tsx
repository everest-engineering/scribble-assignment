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
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room) return;

    const interval = setInterval(() => {
      roomStore.fetchRoom().catch(() => {});
    }, 2000);

    return () => clearInterval(interval);
  }, [room?.code, roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((p) => p.id === participantId) ?? null;
  const isDrawer = room.drawerId === participantId;
  const drawerParticipant = room.participants.find((p) => p.id === room.drawerId) ?? null;

  function getCanvasPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCanvasPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function handleMouseUp() {
    setIsDrawing(false);
  }

  function handleClearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function handleGuessSubmit(text: string) {
    await roomStore.submitGuess(text);
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
          <Scoreboard participants={room.participants} />
          <ResultPanel guesses={room.guesses} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            {isDrawer ? (
              <div>
                <p style={{ marginBottom: "8px" }}>
                  Your word: <strong>{room.currentWord}</strong>
                </p>
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={420}
                  style={{ border: "1px solid #e5e7eb", backgroundColor: "#ffffff", cursor: "crosshair", display: "block" }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
                <div className="button-row" style={{ marginTop: "8px" }}>
                  <button className="button button--secondary" onClick={handleClearCanvas}>
                    Clear Canvas
                  </button>
                </div>
              </div>
            ) : (
              <div className="canvas-placeholder" style={{ minHeight: "500px", backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                <p>Waiting for {drawerParticipant?.name ?? "the drawer"} to draw...</p>
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

          {!isDrawer && (
            <Card title="Your Guess">
              <GuessForm onSubmit={handleGuessSubmit} />
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
