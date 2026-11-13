import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";
import { api } from "../services/api";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [pollingError, setPollingError] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const canvasInitializedRef = useRef(false);

  const roomCode = room?.code;

  useEffect(() => {
    if (!roomCode) {
      navigate("/", { replace: true });
      return;
    }

    // Fetch once on mount to handle reload or direct navigation
    roomStore.fetchRoom().catch((caughtError) => {
      if (caughtError instanceof Error && caughtError.message.includes("Unable to load room")) {
        roomStore.clearSession();
        navigate("/", { replace: true });
      }
    });

    const intervalId = setInterval(async () => {
      try {
        await roomStore.fetchRoom();
        setPollingError(false);
      } catch (caughtError) {
        if (caughtError instanceof Error && caughtError.message.includes("Unable to load room")) {
          roomStore.clearSession();
          navigate("/", { replace: true });
        } else {
          setPollingError(true);
        }
      }
    }, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, [navigate, roomCode, roomStore]);

  useEffect(() => {
    if (room?.status === "lobby") {
      navigate("/lobby");
    }
  }, [navigate, room?.status]);

  const viewer = room?.participants.find((participant) => participant.id === participantId) ?? null;

  // Prevent scrolling when drawing on touch screens
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventDefault = (e: TouchEvent) => {
      if (viewer?.role === "drawer") {
        e.preventDefault();
      }
    };

    canvas.addEventListener("touchstart", preventDefault, { passive: false });
    canvas.addEventListener("touchmove", preventDefault, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", preventDefault);
      canvas.removeEventListener("touchmove", preventDefault);
    };
  }, [viewer?.role]);

  // Load existing drawing once on mount for the drawer
  useEffect(() => {
    if (viewer?.role === "drawer" && room?.drawingData && canvasRef.current && !canvasInitializedRef.current) {
      canvasInitializedRef.current = true;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const img = new Image();
        img.src = room.drawingData;
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
      }
    }
  }, [viewer?.role, room?.drawingData]);

  if (!room) {
    return null;
  }

  function getCoordinates(event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in event) {
      if (event.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }
  }

  function startDrawing(event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (viewer?.role !== "drawer") return;
    const { x, y } = getCoordinates(event);
    setLastPos({ x, y });
    setIsDrawing(true);
  }

  function draw(event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing || viewer?.role !== "drawer") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(event);

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    setLastPos({ x, y });
  }

  async function stopDrawing() {
    if (!isDrawing || viewer?.role !== "drawer" || !roomCode) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    try {
      await api.updateDrawing(roomCode, dataUrl);
    } catch (err) {
      console.error("Failed to sync drawing:", err);
    }
  }

  async function handleClearCanvas() {
    if (viewer?.role !== "drawer" || !roomCode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    try {
      await api.clearDrawing(roomCode);
    } catch (err) {
      console.error("Failed to clear drawing:", err);
    }
  }

  async function handleGuessSubmit(guessText: string) {
    if (!roomCode || !participantId) return;
    await api.submitGuess(roomCode, participantId, guessText);
    await roomStore.fetchRoom();
  }

  async function handleEndRound() {
    if (!roomCode || !participantId) return;
    try {
      await api.endRound(roomCode, participantId);
      await roomStore.fetchRoom();
    } catch (err) {
      console.error("Failed to end round:", err);
    }
  }

  async function handleRestartGame() {
    if (!roomCode || !participantId) return;
    try {
      await api.restartGame(roomCode, participantId);
      await roomStore.fetchRoom();
    } catch (err) {
      console.error("Failed to restart game:", err);
    }
  }

  const viewerHasCorrectGuess = room.guesses?.some(
    (g) => g.playerName === viewer?.name && g.isCorrect
  ) ?? false;

  return (
    <section className="panel game-page">
      {pollingError && (
        <div className="form__error" style={{ marginBottom: "24px" }}>
          Network connection lost. Trying to reconnect to server...
        </div>
      )}
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} currentPlayerId={participantId ?? undefined} />
          <ResultPanel guesses={room.guesses} />
        </aside>

        <div className="game-page__main">
          {room.status === "result" ? (
            <Card title="Round Results">
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 24px",
                textAlign: "center"
              }}>
                <div style={{
                  fontSize: "2.5rem",
                  marginBottom: "16px",
                  animation: "bounce 2s infinite"
                }}>
                  🏆
                </div>
                <h2 style={{
                  fontSize: "1.75rem",
                  fontWeight: "800",
                  color: "var(--brand-strong)",
                  marginBottom: "8px",
                  background: "linear-gradient(to right, #4f46e5, #818cf8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}>
                  Round Ended!
                </h2>
                <p style={{
                  fontSize: "1rem",
                  color: "#4b5563",
                  marginBottom: "24px"
                }}>
                  Here is how everyone performed.
                </p>
                
                <div style={{
                  background: "#e0e7ff",
                  border: "2px dashed #818cf8",
                  borderRadius: "12px",
                  padding: "20px 40px",
                  marginBottom: "32px"
                }}>
                  <span style={{
                    fontSize: "0.875rem",
                    color: "#4f46e5",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "4px"
                  }}>
                    The secret word was
                  </span>
                  <span style={{
                    fontSize: "2.5rem",
                    fontWeight: "900",
                    color: "#312e81",
                    textTransform: "uppercase",
                    letterSpacing: "2px"
                  }}>
                    {room.secretWord}
                  </span>
                </div>

                {viewer?.isHost ? (
                  <div style={{ width: "100%", maxWidth: "320px" }}>
                    <button
                      className="button button--primary"
                      style={{
                        width: "100%",
                        padding: "12px 24px",
                        fontSize: "1rem",
                        fontWeight: "600",
                        boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)"
                      }}
                      onClick={handleRestartGame}
                    >
                      Restart Game
                    </button>
                    <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "8px" }}>
                      As the host, you can start a new round.
                    </p>
                  </div>
                ) : (
                  <div style={{
                    padding: "12px 24px",
                    background: "#f3f4f6",
                    borderRadius: "8px",
                    color: "#4b5563",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <span className="spinner"></span>
                    Waiting for host to restart...
                  </div>
                )}
              </div>
            </Card>
          ) : viewer?.role === "drawer" ? (
            <Card title="Canvas">
              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{
                  width: "100%",
                  height: "400px",
                  display: "block",
                  background: "white",
                  cursor: "crosshair",
                  border: "1px solid var(--line)",
                  borderRadius: "8px"
                }}
              />
              <div className="button-row button-row--compact" style={{ marginTop: "12px" }}>
                <button className="button button--secondary" onClick={handleClearCanvas}>
                  Clear Canvas
                </button>
              </div>
            </Card>
          ) : (
            <Card title="Canvas">
              {room.drawingData ? (
                <img
                  src={room.drawingData}
                  alt="Drawer's canvas"
                  style={{
                    width: "100%",
                    height: "400px",
                    objectFit: "contain",
                    background: "white",
                    display: "block",
                    border: "1px solid var(--line)",
                    borderRadius: "8px"
                  }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "400px",
                    background: "#f9fafb",
                    color: "#9ca3af",
                    fontSize: "1.125rem",
                    fontWeight: "500",
                    border: "1px solid var(--line)",
                    borderRadius: "8px"
                  }}
                >
                  Waiting for the drawer to start drawing...
                </div>
              )}
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
                <dd>
                  <span className="card__badge" style={{ textTransform: "capitalize", padding: "2px 8px", fontSize: "0.75rem", borderRadius: "4px" }}>
                    {viewer?.role ?? "guesser"}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{room.status === "result" ? "Round Ended" : "Playing"}</dd>
              </div>
            </dl>
          </Card>

          {room.status === "game" && viewer?.role === "drawer" && room.secretWord && (
            <Card title="Secret Word">
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <span style={{ fontSize: "2rem", fontWeight: "bold", letterSpacing: "2px", color: "#3730a3", textTransform: "uppercase" }}>
                  {room.secretWord}
                </span>
                <p style={{ fontSize: "0.875rem", color: "#4b5563", marginTop: "8px" }}>
                  Draw this word on the canvas!
                </p>
              </div>
            </Card>
          )}

          {room.status === "game" && viewer?.role === "guesser" && (
            <Card title="Your Guess">
              {viewerHasCorrectGuess ? (
                <div style={{ textAlign: "center", padding: "16px 0", color: "#15803d", fontWeight: "600" }}>
                  🎉 You guessed the secret word correctly!
                </div>
              ) : (
                <GuessForm onSubmitGuess={handleGuessSubmit} />
              )}
            </Card>
          )}
        </aside>
      </div>

      <div className="button-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
        {room.status === "game" && viewer?.isHost && (
          <button className="button button--primary" onClick={handleEndRound}>
            End Round
          </button>
        )}
      </div>
    </section>
  );
}
