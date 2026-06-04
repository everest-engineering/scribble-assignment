import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

interface Point {
  x: number;
  y: number;
}

interface Line {
  color: string;
  width: number;
  points: Point[];
}

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [localLines, setLocalLines] = useState<Line[]>([]);
  const [selectedColor, setSelectedColor] = useState("#1f2937");
  const [selectedWidth, setSelectedWidth] = useState(4);

  const serverLines: Line[] = (() => {
    try {
      return JSON.parse(room?.canvasData || "[]");
    } catch {
      return [];
    }
  })();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    } else if (room.status === "lobby") {
      navigate("/lobby");
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room) return;
    if (room.viewerRole !== "drawer") {
      setLocalLines(serverLines);
    }
  }, [room?.viewerRole, room?.canvasData]);

  useEffect(() => {
    if (!room) return;
    if (room.viewerRole === "drawer") {
      if (serverLines.length === 0 && localLines.length > 0) {
        setLocalLines([]);
      }
    }
  }, [serverLines.length, room?.viewerRole]);

  useEffect(() => {
    if (!room) return;

    const interval = setInterval(() => {
      roomStore.fetchRoom().catch(() => {});
    }, 2000);

    return () => clearInterval(interval);
  }, [roomStore, room?.code]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, 800, 500);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    localLines.forEach((line) => {
      if (line.points.length === 0) return;
      ctx.beginPath();
      ctx.strokeStyle = line.color || "#000000";
      ctx.lineWidth = line.width || 4;
      ctx.moveTo(line.points[0].x, line.points[0].y);
      for (let i = 1; i < line.points.length; i++) {
        ctx.lineTo(line.points[i].x, line.points[i].y);
      }
      ctx.stroke();
    });
  }, [localLines]);

  if (!room) {
    return null;
  }

  function getMousePos(canvas: HTMLCanvasElement, event: React.MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 500 / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (room.viewerRole !== "drawer") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getMousePos(canvas, event);

    setIsDrawing(true);
    const newLine: Line = {
      color: selectedColor,
      width: selectedWidth,
      points: [pos]
    };
    setLocalLines((prev) => [...prev, newLine]);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || room.viewerRole !== "drawer") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getMousePos(canvas, event);

    setLocalLines((prev) => {
      if (prev.length === 0) return prev;
      const lastLine = prev[prev.length - 1];
      const updatedLastLine = {
        ...lastLine,
        points: [...lastLine.points, pos]
      };
      return [...prev.slice(0, -1), updatedLastLine];
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || room.viewerRole !== "drawer") return;
    setIsDrawing(false);

    roomStore.submitDraw(JSON.stringify(localLines)).catch(() => {});
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      handleMouseUp();
    }
  };

  const handleClearCanvas = async () => {
    setLocalLines([]);
    try {
      await roomStore.submitDraw("[]");
    } catch (err) {
      console.error("Failed to clear canvas", err);
    }
  };

  const isHost = room.hostId === participantId;

  const handleRestart = async () => {
    try {
      await roomStore.restartRoom();
    } catch (err) {
      console.error("Failed to restart room", err);
    }
  };

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((participant) => participant.id === room.drawerId) ?? null;

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
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  position: "relative",
                  border: "2px solid var(--line)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  background: "#ffffff"
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={500}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    cursor: room.viewerRole === "drawer" ? "crosshair" : "default",
                    backgroundColor: "#ffffff"
                  }}
                />

                {room.status === "result" && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundColor: "rgba(31, 41, 55, 0.95)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      padding: "32px",
                      zIndex: 10,
                      textAlign: "center"
                    }}
                  >
                    <span style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Round Ended
                    </span>
                    <h2 style={{ fontSize: "2.25rem", margin: "12px 0 24px", fontWeight: 800 }}>
                      Word was: <span style={{ color: "#10b981" }}>{room.secretWord}</span>
                    </h2>

                    <div style={{ width: "100%", maxWidth: "360px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
                      <h3 style={{ margin: "0 0 12px", fontSize: "1.1rem", fontWeight: 600, borderBottom: "1px dashed rgba(255,255,255,0.2)", paddingBottom: "8px" }}>
                        Final Scores
                      </h3>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {room.participants.map((p) => (
                          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem" }}>
                            <span>{p.name} {p.id === room.hostId && "👑"}</span>
                            <strong style={{ color: "var(--accent)" }}>{room.scores[p.id] ?? 0} pts</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    {isHost ? (
                      <button className="button button--primary" onClick={handleRestart} style={{ minWidth: "180px" }}>
                        Restart Game
                      </button>
                    ) : (
                      <p style={{ color: "#9ca3af", fontSize: "0.95rem" }}>Waiting for the host to restart the game...</p>
                    )}
                  </div>
                )}
              </div>

              {room.viewerRole === "drawer" && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>Color:</span>
                      {["#1f2937", "#2563eb", "#ef4444", "#10b981"].map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            backgroundColor: color,
                            border: selectedColor === color ? "3px solid var(--accent)" : "1px solid var(--line)",
                            cursor: "pointer",
                            padding: 0
                          }}
                        />
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>Brush:</span>
                      {[4, 8, 12].map((width) => (
                        <button
                          key={width}
                          onClick={() => setSelectedWidth(width)}
                          className="button"
                          style={{
                            minHeight: "32px",
                            height: "32px",
                            padding: "0 8px",
                            fontSize: "0.75rem",
                            border: selectedWidth === width ? "2px solid var(--brand)" : "1px solid var(--line)",
                            backgroundColor: selectedWidth === width ? "var(--surface-strong)" : "var(--surface)",
                            color: "var(--ink)"
                          }}
                        >
                          {width}px
                        </button>
                      ))}
                    </div>
                  </div>

                  <button className="button button--secondary" onClick={handleClearCanvas}>
                    Clear Canvas
                  </button>
                </div>
              )}
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
                <dt>Your Role</dt>
                <dd style={{ fontWeight: "bold" }}>
                  {room.viewerRole === "drawer" ? "✍️ Drawer" : "🔍 Guesser"}
                </dd>
              </div>
              <div>
                <dt>Drawing Player</dt>
                <dd>{drawer?.name ?? "Unknown"}</dd>
              </div>
              {room.viewerRole === "drawer" && room.secretWord && (
                <div>
                  <dt>Secret Word</dt>
                  <dd style={{ fontSize: "1.25rem", fontWeight: "bold", color: "var(--accent)" }}>
                    {room.secretWord}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {room.viewerRole === "guesser" && (
            <Card title="Your Guess">
              <GuessForm />
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
