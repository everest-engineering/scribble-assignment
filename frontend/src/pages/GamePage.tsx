import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { api } from "../services/api";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [guessError, setGuessError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    const id = setInterval(() => {
      roomStore.fetchRoom().catch(() => {});
    }, 2000);
    return () => clearInterval(id);
  }, [roomStore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000";

    function getPos(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function onMouseDown(e: MouseEvent) {
      isDrawingRef.current = true;
      const { x, y } = getPos(e);
      ctx!.beginPath();
      ctx!.moveTo(x, y);
    }

    function onMouseMove(e: MouseEvent) {
      if (!isDrawingRef.current) return;
      const { x, y } = getPos(e);
      ctx!.lineTo(x, y);
      ctx!.stroke();
    }

    function onMouseUp() {
      isDrawingRef.current = false;
    }

    function onMouseLeave() {
      isDrawingRef.current = false;
    }

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseLeave);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((p) => p.id === participantId) ?? null;
  const drawerName = room.participants.find((p) => p.id === room.drawerParticipantId)?.name ?? "Unknown";
  const isDrawer = room.viewerRole === "drawer";

  async function handleGuess(guess: string) {
    if (!room || !participantId) return;
    setGuessError(null);
    try {
      const response = await api.submitGuess(room.code, participantId, guess);
      roomStore.setRoomSnapshot(response.room);
    } catch (err) {
      setGuessError(err instanceof Error ? err.message : "Failed to submit guess");
      throw err;
    }
  }

  function handleClear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
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
          <Scoreboard scores={room.scores} participants={room.participants} />
          <ResultPanel guesses={room.guesses} />
        </aside>

        <div className="game-page__main">
          {isDrawer && (
            <p style={{ fontWeight: "bold", marginBottom: "8px" }}>
              You are the Drawer — draw: {room.currentWord}
            </p>
          )}
          {!isDrawer && room.viewerRole === "guesser" && (
            <p style={{ marginBottom: "8px" }}>You are a Guesser — guess the word!</p>
          )}
          <p style={{ marginBottom: "12px", color: "#6b7280" }}>{drawerName} is drawing</p>

          <Card title="Canvas">
            {isDrawer ? (
              <>
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={500}
                  style={{ border: "1px solid #e5e7eb", backgroundColor: "#ffffff", display: "block", maxWidth: "100%" }}
                />
                <div style={{ marginTop: "8px" }}>
                  <button className="button button--secondary" onClick={handleClear}>
                    Clear
                  </button>
                </div>
              </>
            ) : (
              <div className="canvas-placeholder" style={{ minHeight: "500px", backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                Waiting for drawer...
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
                <dt>Status</dt>
                <dd>{isDrawer ? "Drawing" : "Guessing"}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Your Guess">
            <GuessForm disabled={isDrawer} onSubmit={handleGuess} error={guessError} />
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
