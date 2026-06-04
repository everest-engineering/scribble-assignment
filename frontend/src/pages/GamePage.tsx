import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { usePolling, useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const { room, participantId } = useRoomState();
  const roomStore = useRoomStore();
  const [guessError, setGuessError] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  usePolling(true);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (room && room.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room?.status]);

  const isDrawer = participantId === room?.drawerId;
  const isHost = participantId === room?.hostId;
  const isResult = room?.status === "result";
  const viewer = room?.participants.find((p) => p.id === participantId) ?? null;

  const handleCanvasUpdate = useCallback(async (data: string) => {
    try {
      await roomStore.updateCanvas(data);
    } catch {}
  }, [roomStore]);

  const handleCanvasClear = useCallback(async () => {
    try {
      await roomStore.clearCanvas();
    } catch {}
  }, [roomStore]);

  async function handleGuess(text: string) {
    try {
      setGuessError(null);
      await roomStore.submitGuess(text);
    } catch (caughtError) {
      setGuessError(caughtError instanceof Error ? caughtError.message : "Unable to submit guess");
    }
  }

  async function handleRestart() {
    try {
      setLocalError(null);
      await roomStore.restartGame();
    } catch (caughtError) {
      setLocalError(caughtError instanceof Error ? caughtError.message : "Unable to restart");
    }
  }

  if (!room) {
    return null;
  }

  if (isResult) {
    return (
      <section className="panel game-page">
        <div className="game-page__header">
          <div className="game-page__header-left">
            <span className="section-kicker">Round Complete</span>
            <h1 className="game-page__title">Results</h1>
          </div>
          <RoomCodeBadge code={room.code} />
        </div>

        <div className="game-page__layout">
          <aside className="game-page__sidebar game-page__sidebar--left">
            <Card title="Final Scores">
              <div className="placeholder-block">
                {room.participants
                  .sort((a, b) => (room.scores[b.id] ?? 0) - (room.scores[a.id] ?? 0))
                  .map((p) => (
                    <div key={p.id} className="placeholder-row">
                      <span>{p.name}{p.id === room.drawerId ? " (Drawer)" : ""}</span>
                      <strong>{room.scores[p.id] ?? 0}</strong>
                    </div>
                  ))}
              </div>
            </Card>
          </aside>

          <div className="game-page__main">
            <Card title="The Word Was">
              <p style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', color: '#059669' }}>
                {room.secretWord || "???"}
              </p>
            </Card>
            <Card title="Guess History">
              <div className="placeholder-block">
                {room.guesses.length === 0 ? (
                  <p>No guesses were submitted.</p>
                ) : (
                  room.guesses.map((g, i) => (
                    <div key={i} className="placeholder-row">
                      <span>{g.participantName}: {g.text}</span>
                      <strong style={{ color: g.correct ? '#059669' : '#dc2626' }}>
                        {g.correct ? "Correct!" : "Incorrect"}
                      </strong>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <aside className="game-page__sidebar game-page__sidebar--right">
            {isHost ? (
              <button className="button button--primary" onClick={handleRestart} disabled={roomStore.getSnapshot().isLoading}>
                Play Again
              </button>
            ) : (
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Waiting for host to restart...</p>
            )}
            {localError ? <p className="form__error">{localError}</p> : null}
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round in Progress</span>
          <h1 className="game-page__title">{isDrawer ? "Draw the Word!" : "Guess the Word!"}</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          {isDrawer ? (
            <Card title={`Your Word: ${room.secretWord || "???"}`}>
              <DrawingCanvas
                canvasData={room.canvasData}
                onUpdate={handleCanvasUpdate}
                onClear={handleCanvasClear}
              />
            </Card>
          ) : (
            <Card title="Canvas">
              <CanvasDisplay canvasData={room.canvasData} />
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
                <dd>{isDrawer ? "Drawing" : "Guessing"}</dd>
              </div>
            </dl>
          </Card>

          {!isDrawer ? (
            <Card title="Your Guess">
              <GuessForm onSubmit={handleGuess} />
              {guessError ? <p className="form__error" style={{ marginTop: '8px' }}>{guessError}</p> : null}
            </Card>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function CanvasDisplay({ canvasData }: { canvasData: string | null }) {
  return (
    <div
      className="canvas-placeholder"
      style={{
        minHeight: '300px',
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        backgroundImage: canvasData ? `url(${canvasData})` : undefined,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center'
      }}
    >
      {canvasData ? null : "Waiting for drawing..."}
    </div>
  );
}

function DrawingCanvas({
  canvasData,
  onUpdate,
  onClear
}: {
  canvasData: string | null;
  onUpdate: (data: string) => void;
  onClear: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (canvasData) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = canvasData;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [canvasData]);

  function getPos(event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if ("touches" in event) {
      const touch = event.touches[0] ?? event.changedTouches[0];
      if (!touch) return null;
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function startDrawing(event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    event.preventDefault();
    setIsDrawing(true);
    const pos = getPos(event);
    if (pos) {
      lastPosRef.current = pos;
    }
  }

  function draw(event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentPos = getPos(event);
    const lastPos = lastPosRef.current;
    if (!currentPos || !lastPos) return;

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();

    lastPosRef.current = currentPos;
  }

  function stopDrawing() {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPosRef.current = null;

    const canvas = canvasRef.current;
    if (canvas) {
      onUpdate(canvas.toDataURL("image/png"));
    }
  }

  function handleClear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onClear();
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        style={{
          width: '100%',
          height: 'auto',
          aspectRatio: '3/2',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          cursor: 'crosshair',
          touchAction: 'none'
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="button-row" style={{ marginTop: '8px' }}>
        <button className="button button--secondary" onClick={handleClear} type="button">
          Clear Canvas
        </button>
      </div>
    </div>
  );
}
