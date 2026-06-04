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
  const { room, participantId, pollError } = useRoomState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [guessResult, setGuessResult] = useState<"correct" | "incorrect" | null>(null);
  const [guessError, setGuessError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room) return;
    roomStore.startPolling(2000);
    return () => {
      roomStore.stopPolling();
    };
  }, [roomStore, room?.code]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !room) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of room.strokes) {
      if (stroke.type === "draw") {
        ctx.beginPath();
        ctx.moveTo(stroke.x0, stroke.y0);
        ctx.lineTo(stroke.x1, stroke.y1);
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.lineWidth;
        ctx.stroke();
      }
    }
  }, [room?.strokes]);

  if (!room) {
    return null;
  }

  const isHost = room.hostId === participantId;

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = room.drawerId === participantId;
  const drawerName = room.participants.find((p) => p.id === room.drawerId)?.name ?? "Unknown drawer";

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      {room.status === "lobby" && (
        <div className="game-page__layout">
          <aside className="game-page__sidebar game-page__sidebar--left">
            <Scoreboard participants={room.participants} />
          </aside>

          <div className="game-page__main">
            <Card title="Lobby">
              <p>Waiting for the host to start the next round.</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "1rem 0 0" }}>
                {room.participants.map((p) => (
                  <li key={p.id} style={{ padding: "0.25rem 0" }}>
                    {p.name} {p.id === room.hostId && "(Host)"}
                  </li>
                ))}
              </ul>
              {isHost ? (
                <div className="button-row button-row--compact" style={{ marginTop: "1rem" }}>
                  <button
                    className="button button--primary"
                    type="button"
                    onClick={() => {
                      if (!room || !participantId) return;
                      api.startGame(room.code, participantId)
                        .then(() => roomStore.fetchRoom())
                        .catch(() => {});
                    }}
                  >
                    Start Game
                  </button>
                </div>
              ) : (
                <p style={{ marginTop: "1rem", color: "#6b7280" }}>Waiting for host to start...</p>
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
                  <dd>Lobby</dd>
                </div>
              </dl>
            </Card>
          </aside>
        </div>
      )}

      {room.status === "playing" && (
        <div className="game-page__layout">
          <aside className="game-page__sidebar game-page__sidebar--left">
            <Scoreboard participants={room.participants} />
            <ResultPanel guesses={room.guesses} />
          </aside>

          <div className="game-page__main">
            <Card title="Canvas">
              {room.drawerId === null ? (
                <p>Loading game...</p>
              ) : (
                <>
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={500}
                    style={{
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#ffffff",
                      pointerEvents: isDrawer ? "auto" : "none"
                    }}
                    onMouseDown={(event) => {
                      if (!isDrawer || !canvasRef.current) return;
                      const rect = canvasRef.current.getBoundingClientRect();
                      const x = event.clientX - rect.left;
                      const y = event.clientY - rect.top;
                      setIsDrawing(true);
                      setStartPos({ x, y });
                      setLastPos({ x, y });
                    }}
                    onMouseMove={(event) => {
                      if (!isDrawing || !isDrawer || !canvasRef.current || !lastPos) return;
                      const rect = canvasRef.current.getBoundingClientRect();
                      const x = event.clientX - rect.left;
                      const y = event.clientY - rect.top;
                      const ctx = canvasRef.current.getContext("2d");
                      if (!ctx) return;
                      ctx.beginPath();
                      ctx.moveTo(lastPos.x, lastPos.y);
                      ctx.lineTo(x, y);
                      ctx.strokeStyle = "#000000";
                      ctx.lineWidth = 3;
                      ctx.stroke();
                      setLastPos({ x, y });
                    }}
                    onMouseUp={() => {
                      if (!isDrawing || !isDrawer || !canvasRef.current || !startPos || !lastPos || !room || !participantId) return;
                      api.submitStroke(room.code, participantId, {
                        type: "draw",
                        x0: startPos.x,
                        y0: startPos.y,
                        x1: lastPos.x,
                        y1: lastPos.y,
                        color: "#000000",
                        lineWidth: 3
                      }).then(() => roomStore.fetchRoom()).catch(() => {});
                      setIsDrawing(false);
                      setStartPos(null);
                      setLastPos(null);
                    }}
                  />
                  {isDrawer ? (
                    <div className="button-row button-row--compact" style={{ marginTop: "0.5rem" }}>
                      <button
                        className="button button--secondary"
                        type="button"
                        onClick={() => {
                          if (!room || !participantId) return;
                          api.submitStroke(room.code, participantId, { type: "clear" })
                            .then(() => roomStore.fetchRoom())
                            .catch(() => {});
                        }}
                      >
                        Clear Canvas
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </Card>
          </div>

          <aside className="game-page__sidebar game-page__sidebar--right">
            <Card title="Drawer">
              <p>{isDrawer ? "You are the drawer" : `Drawing: ${drawerName}`}</p>
            </Card>

            <Card title="Secret Word">
              <p>{room.currentWord !== null ? room.currentWord : "Guess the word!"}</p>
            </Card>

            <Card title="Player Info">
              <dl className="detail-list">
                <div>
                  <dt>Name</dt>
                  <dd>{viewer?.name ?? "Unknown player"}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>Playing</dd>
                </div>
              </dl>
            </Card>

            {pollError ? <p className="form__error">{pollError}</p> : null}

            <Card title="Your Guess">
              {isDrawer ? (
                <p>You are drawing — guess form is hidden</p>
              ) : (
                <GuessForm
                  onSubmit={(guess) => {
                    if (!room || !participantId) return;
                    setGuessError(null);
                    setGuessResult(null);
                    api.submitGuess(room.code, participantId, guess)
                      .then((result) => {
                        setGuessResult(result.correct ? "correct" : "incorrect");
                        roomStore.fetchRoom();
                      })
                      .catch((error) => {
                        setGuessError(error instanceof Error ? error.message : "Guess failed");
                      });
                  }}
                  error={guessError ?? undefined}
                  lastResult={guessResult ?? undefined}
                />
              )}
            </Card>

            <Card title="Guess History">
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {room.guesses.map((g, index) => (
                  <li key={index} style={{ padding: "0.25rem 0", fontSize: "0.875rem" }}>
                    <strong>{g.participantName}</strong>: {g.text}{" "}
                    {g.correct ? <span style={{ color: "green" }}>✓</span> : <span style={{ color: "red" }}>✗</span>}
                  </li>
                ))}
              </ul>
            </Card>
          </aside>
        </div>
      )}

      {room.status === "finished" && (
        <div className="game-page__layout">
          <aside className="game-page__sidebar game-page__sidebar--left">
            <Scoreboard participants={room.participants} />
            <ResultPanel guesses={room.guesses} />
          </aside>

          <div className="game-page__main">
            <Card title="Result">
              <p style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                The word was: {room.currentWord}
              </p>
              <div style={{ marginTop: "1rem" }}>
                <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Guess History</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {room.guesses.map((g, index) => (
                    <li key={index} style={{ padding: "0.25rem 0", fontSize: "0.875rem" }}>
                      <strong>{g.participantName}</strong>: {g.text}{" "}
                      {g.correct ? <span style={{ color: "green" }}>✓</span> : <span style={{ color: "red" }}>✗</span>}
                    </li>
                  ))}
                </ul>
              </div>
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
                  <dd>Finished</dd>
                </div>
              </dl>
            </Card>

            {isHost ? (
              <Card title="Next Round">
                <div className="button-row button-row--compact">
                  <button
                    className="button button--primary"
                    type="button"
                    onClick={() => {
                      if (!room || !participantId) return;
                      api.restartGame(room.code, participantId)
                        .then(() => roomStore.fetchRoom())
                        .catch(() => {});
                    }}
                  >
                    Restart Game
                  </button>
                </div>
              </Card>
            ) : (
              <Card title="Next Round">
                <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  Waiting for host to restart...
                </p>
              </Card>
            )}
          </aside>
        </div>
      )}

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
