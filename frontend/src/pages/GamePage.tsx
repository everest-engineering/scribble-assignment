import { useEffect, useRef } from "react";
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

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  // Keep the shared round state live for every player while on the game screen.
  useEffect(() => {
    roomStore.startPolling();
    return () => roomStore.stopPolling();
  }, [roomStore]);

  // After the host restarts, the room returns to the lobby for everyone (observed via polling).
  useEffect(() => {
    if (room && room.status === "lobby") {
      navigate("/lobby");
    }
  }, [navigate, room]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = Boolean(participantId && room.drawerId === participantId);
  const isHost = Boolean(participantId && room.hostId === participantId);
  const isResult = room.status === "result";
  const drawer = room.participants.find((participant) => participant.id === room.drawerId) ?? null;
  const guesses = room.guesses ?? [];

  async function handleRestart() {
    try {
      await roomStore.restartGame();
      navigate("/lobby");
    } catch {
      // Error surfaces via room state; stay on the result screen so the host can retry.
    }
  }

  function pointerPosition(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer) {
      return;
    }
    const context = canvasRef.current?.getContext("2d");
    if (!context) {
      return;
    }
    isDrawingRef.current = true;
    const { x, y } = pointerPosition(event);
    context.lineWidth = 3;
    context.lineCap = "round";
    context.strokeStyle = "#1f2937";
    context.beginPath();
    context.moveTo(x, y);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer || !isDrawingRef.current) {
      return;
    }
    const context = canvasRef.current?.getContext("2d");
    if (!context) {
      return;
    }
    const { x, y } = pointerPosition(event);
    context.lineTo(x, y);
    context.stroke();
  }

  function handlePointerUp() {
    isDrawingRef.current = false;
  }

  function handleClearCanvas() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
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
          <Card title="Canvas">
            <div className="word-banner" style={{ marginBottom: '12px', fontWeight: 600 }}>
              {isDrawer ? (
                <span>Your word to draw: <strong>{room.word ?? "…"}</strong></span>
              ) : room.hasWord ? (
                <span>{drawer?.name ?? "The drawer"} is drawing. Guess the word!</span>
              ) : (
                <span>Waiting for the round to start…</span>
              )}
            </div>
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{
                width: '100%',
                height: '500px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                touchAction: 'none',
                cursor: isDrawer ? 'crosshair' : 'not-allowed'
              }}
            />
            {isDrawer ? (
              <div className="button-row button-row--compact" style={{ marginTop: '12px' }}>
                <button className="button button--secondary" type="button" onClick={handleClearCanvas}>
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
            </dl>
          </Card>

          <Card title="Your Guess">
            {isDrawer ? (
              <p>You are the drawer — you can't guess this round.</p>
            ) : (
              <GuessForm disabled={room.status !== "active"} />
            )}
          </Card>

          <Card title="Guesses">
            {guesses.length === 0 ? (
              <p>No guesses yet.</p>
            ) : (
              <ul className="player-list">
                {guesses.map((guess) => (
                  <li key={guess.id}>
                    <span>
                      <strong>{guess.playerName}:</strong> {guess.text}
                    </span>
                    <span className="player-list__meta">{guess.correct ? "✅ +100" : "❌"}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
        {isResult && isHost ? (
          <button className="button button--primary" onClick={handleRestart}>
            Restart Game
          </button>
        ) : null}
        {isResult && !isHost ? (
          <span className="player-list__meta">Waiting for the host to restart…</span>
        ) : null}
      </div>
    </section>
  );
}
