import { useCallback, useEffect, useRef, type MouseEvent } from "react";
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const prevStatusRef = useRef<string | null>(null);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

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
    if (room) {
      roomStore.startPolling(2000);
    }
    return () => {
      roomStore.stopPolling();
    };
  }, [room, roomStore]);

  useEffect(() => {
    if (prevStatusRef.current !== null && prevStatusRef.current !== "result" && room?.status === "result") {
      clearCanvas();
    }
    prevStatusRef.current = room?.status ?? null;
  }, [room?.status, clearCanvas]);

  const getCanvasPos = useCallback((event: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }, []);

  const handleMouseDown = useCallback((event: MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(event);
    isDrawingRef.current = true;
    lastPosRef.current = pos;
  }, [getCanvasPos]);

  const handleMouseMove = useCallback((event: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getCanvasPos(event);

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    lastPosRef.current = pos;
  }, [getCanvasPos]);

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((participant) => participant.id === room.drawerId) ?? null;
  const isDrawer = participantId === room.drawerId;
  const isHost = viewer?.id === room.hostId;

  const handleEndRound = async () => {
    await roomStore.endRound();
  };

  const handleRestart = async () => {
    const response = await roomStore.restartGame();
    if (response) {
      navigate("/lobby");
    }
  };

  if (room.status === "result") {
    return (
      <section className="panel game-page">
        <div className="game-page__header">
          <div className="game-page__header-left">
            <span className="section-kicker">Round Complete</span>
            <h1 className="game-page__title">The word was</h1>
          </div>
          <RoomCodeBadge code={room.code} />
        </div>

        <div className="game-page__layout">
          <aside className="game-page__sidebar game-page__sidebar--left">
            <Scoreboard participants={room.participants} drawerId={room.drawerId} />
            <ResultPanel guesses={room.guesses} participants={room.participants} />
          </aside>

          <div className="game-page__main">
            <Card title="Revealed Word">
              <div className="secret-word secret-word--revealed">{room.secretWord}</div>
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
                  <dt>Drawer</dt>
                  <dd>{drawer?.name ?? "Unknown"}</dd>
                </div>
              </dl>
            </Card>
          </aside>
        </div>

        <div className="button-row">
          {isHost ? (
            <button className="button button--primary" type="button" onClick={handleRestart}>
              Restart Game
            </button>
          ) : (
            <span className="text-muted">Waiting for host to restart...</span>
          )}
          <button className="button button--secondary" onClick={() => navigate("/lobby")}>
            Exit to Lobby
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">
            {isDrawer ? "Draw this word" : "Guess the Word!"}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} drawerId={room.drawerId} />
          <ResultPanel guesses={room.guesses} participants={room.participants} />
        </aside>

        <div className="game-page__main">
          {isDrawer && room.secretWord ? (
            <Card title="Your Secret Word">
              <div className="secret-word">{room.secretWord}</div>
            </Card>
          ) : null}
          <Card title="Canvas">
            {isDrawer ? (
              <>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={400}
                  style={{
                    display: "block",
                    width: "100%",
                    height: "auto",
                    aspectRatio: "3 / 2",
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    cursor: "crosshair",
                    touchAction: "none"
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                />
                <div className="button-row button-row--compact" style={{ marginTop: "0.5rem" }}>
                  <button className="button button--secondary" type="button" onClick={clearCanvas}>
                    Clear Canvas
                  </button>
                </div>
              </>
            ) : (
              <div className="canvas-placeholder" style={{ minHeight: "400px", backgroundColor: "#fff", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                Waiting for the drawer to draw...
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
              <div>
                <dt>Drawer</dt>
                <dd>{drawer?.name ?? "Unknown"}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Your Guess">
            <GuessForm
              disabled={isDrawer}
              onSubmitGuess={async (text) => {
                await roomStore.submitGuess(text);
              }}
            />
          </Card>
        </aside>
      </div>

      <div className="button-row">
        {isHost && room.status === "playing" ? (
          <button className="button button--primary" type="button" onClick={handleEndRound}>
            End Round
          </button>
        ) : null}
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
