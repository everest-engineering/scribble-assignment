import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type ReactSketchCanvasRef } from "react-sketch-canvas";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { GuessHistory } from "../components/GuessHistory";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { ResponsiveCanvas } from "../components/ResponsiveCanvas";
import { useRoomState, useRoomStore, useRoomPolling } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const lastStrokesJson = useRef<string>("");

  useRoomPolling(2000);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  // Sync canvas paths for guessers
  useEffect(() => {
    const viewer = room?.participants.find(p => p.id === participantId);
    if (viewer?.role === "guesser" && room?.strokes) {
      const strokesJson = JSON.stringify(room.strokes);
      if (strokesJson !== lastStrokesJson.current) {
        lastStrokesJson.current = strokesJson;
        canvasRef.current?.loadPaths(room.strokes as any);
      }
    }
  }, [room?.strokes, participantId]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = viewer?.role === "drawer";

  async function handleStroke() {
    if (!isDrawer) return;
    const paths = await canvasRef.current?.exportPaths();
    if (paths) {
      await roomStore.submitStrokes(paths);
    }
  }

  async function handleClear() {
    if (!isDrawer) return;
    canvasRef.current?.clearCanvas();
    await roomStore.submitStrokes([]);
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">
            {isDrawer ? (
              <span>Draw: <strong style={{ color: '#059669' }}>{room.secretWord ?? "???"}</strong></span>
            ) : (
              "Guess the Word!"
            )}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <GuessHistory />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            {isDrawer && (
              <div className="canvas-tools" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label htmlFor="strokeColor" style={{ fontSize: '0.875rem' }}>Color:</label>
                  <input 
                    id="strokeColor"
                    type="color" 
                    value={strokeColor} 
                    onChange={(e) => setStrokeColor(e.target.value)} 
                    style={{ border: 'none', padding: 0, width: '32px', height: '32px', cursor: 'pointer' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                  <label htmlFor="strokeWidth" style={{ fontSize: '0.875rem' }}>Width:</label>
                  <input 
                    id="strokeWidth"
                    type="range" 
                    min="1" max="20" 
                    value={strokeWidth} 
                    onChange={(e) => setStrokeWidth(parseInt(e.target.value))} 
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '0.875rem', minWidth: '2rem' }}>{strokeWidth}px</span>
                </div>
                <button className="button button--secondary button--compact" onClick={handleClear}>
                  Clear Canvas
                </button>
              </div>
            )}
            <ResponsiveCanvas 
              ref={canvasRef}
              strokeColor={strokeColor}
              strokeWidth={strokeWidth}
              onStroke={handleStroke}
              readOnly={!isDrawer}
            />
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
                <dd style={{ textTransform: 'capitalize' }}>{viewer?.role ?? "Playing"}</dd>
              </div>
              <div>
                <dt>Score</dt>
                <dd><strong>{viewer?.score ?? 0}</strong></dd>
              </div>
            </dl>
          </Card>

          {!isDrawer && (
            <Card title="Your Guess">
              <GuessForm disabled={viewer?.hasGuessedCorrectly} />
              {viewer?.hasGuessedCorrectly && (
                <p style={{ color: '#059669', fontWeight: 'bold', textAlign: 'center', marginTop: '0.5rem' }}>
                  You got it!
                </p>
              )}
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
