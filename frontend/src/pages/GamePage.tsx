import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL_MS = 2000;

export function GamePage() {
  const navigate = useNavigate();
  const store = useRoomStore();
  const { room, participantId } = useRoomState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  const isDrawer = room !== null && room.drawerId !== undefined && room.drawerId === participantId;

  // Drawing effect — attaches mouse listeners to canvas for the drawer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!isDrawer || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000";

    function onMouseDown(event: MouseEvent) {
      isDrawingRef.current = true;
      ctx!.beginPath();
      ctx!.moveTo(event.offsetX, event.offsetY);
    }

    function onMouseMove(event: MouseEvent) {
      if (!isDrawingRef.current) return;
      ctx!.lineTo(event.offsetX, event.offsetY);
      ctx!.stroke();
    }

    function onMouseUp() {
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        store.updateCanvas(canvas.toDataURL()).catch(() => undefined);
      }
    }

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseUp);
    };
  }, [isDrawer, store]);

  // Polling effect — syncs room state every 2 s; redirects on 404
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        await store.fetchRoom();
        setPollError(null);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "";
        if (msg.includes("404") || msg.includes("Unable to load room")) {
          navigate("/", { replace: true });
        } else {
          setPollError(msg || "Failed to sync room state");
        }
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(id);
  }, [store, navigate]);

  if (!room) {
    return null;
  }

  function handleClearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    store.updateCanvas(null).catch(() => undefined);
  }

  async function handleGuessSubmit(guessText: string) {
    await store.submitGuess(guessText);
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
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          {isDrawer && room.secretWord ? (
            <div
              className="word-banner"
              style={{
                backgroundColor: "#fef9c3",
                border: "1px solid #fde047",
                borderRadius: "6px",
                padding: "8px 16px",
                marginBottom: "8px",
                fontWeight: 600,
                fontSize: "1rem",
                color: "#713f12"
              }}
            >
              Your word: {room.secretWord}
            </div>
          ) : null}

          <Card title="Canvas">
            {isDrawer ? (
              <>
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={500}
                  style={{ display: "block", border: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}
                />
                <div className="button-row" style={{ marginTop: "8px" }}>
                  <button className="button button--secondary" onClick={handleClearCanvas}>
                    Clear Canvas
                  </button>
                </div>
              </>
            ) : room.canvasData ? (
              <img
                src={room.canvasData}
                alt="Drawing canvas"
                style={{ display: "block", border: "1px solid #e5e7eb", maxWidth: "100%" }}
              />
            ) : (
              <div
                style={{
                  minHeight: "500px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  fontSize: "1rem",
                  color: "#6b7280"
                }}
              >
                Watch the drawer!
              </div>
            )}
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>
                  {room.participants.find((p) => p.id === participantId)?.name ?? "Unknown player"}
                  {isDrawer ? " (Drawer)" : ""}
                </dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Players">
            <ul className="player-list">
              {room.participants.map((p) => (
                <li key={p.id}>
                  <span>{p.name}</span>
                  <span className="player-list__meta">
                    {p.id === room.drawerId ? "Drawer" : "Guesser"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {!isDrawer ? (
            <Card title="Your Guess">
              <GuessForm onSubmit={handleGuessSubmit} />
            </Card>
          ) : (
            <Card title="Your Guess">
              <GuessForm disabled={true} />
            </Card>
          )}
        </aside>
      </div>

      {pollError ? (
        <p style={{ color: "#991b1b", fontSize: "0.875rem", marginTop: "8px" }}>{pollError}</p>
      ) : null}

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
