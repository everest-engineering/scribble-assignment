import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "../components/Canvas";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { ResultView } from "../components/ResultView";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";
import type { Point } from "../services/api";

const POLL_INTERVAL = 2000;

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    intervalIdRef.current = setInterval(poll, POLL_INTERVAL);
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [roomStore]);

  async function poll() {
    const currentRoom = roomStore.getSnapshot().room;
    if (!currentRoom) return;

    try {
      const snapshot = await roomStore.fetchRoom();
      if (!snapshot) {
        if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        navigate("/", { replace: true });
        return;
      }
      if (snapshot.status === "lobby") {
        if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        navigate("/lobby", { replace: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const is404 = message.toLowerCase().includes("404") || message.toLowerCase().includes("not found");
      if (is404) {
        if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        navigate("/", { replace: true });
      }
    }
  }

  async function handleStrokeComplete(points: Point[]) {
    try {
      await roomStore.submitCanvasStroke(points);
    } catch {
    }
  }

  async function handleClear() {
    try {
      await roomStore.clearCanvas();
    } catch {
    }
  }

  async function handleNextWord() {
    try {
      await roomStore.nextWord();
    } catch {
    }
  }

  async function handleEndGame() {
    try {
      await roomStore.endGame();
    } catch {
    }
  }

  async function handleRestart() {
    try {
      await roomStore.restartGame();
      navigate("/lobby", { replace: true });
    } catch {
    }
  }

  if (!room) {
    return null;
  }

  if (room.status === "result") {
    const isHost = participantId != null && participantId === room.hostId;
    return (
      <ResultView
        room={room}
        participantId={participantId}
        isHost={isHost}
        onRestart={handleRestart}
      />
    );
  }

  const viewer = room.participants.find((p) => p.id === participantId) ?? null;
  const isDrawer = participantId != null && participantId === room.currentDrawerId;
  const hasGuessedCorrectly = participantId != null &&
    room.guesses.some((g) => g.participantId === participantId && g.isCorrect);
  const viewerCorrectGuess = room.guesses.find((g) => g.participantId === participantId && g.isCorrect);
  const viewerPointsAwarded = viewerCorrectGuess?.pointsAwarded ?? 0;

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {room.currentRound}</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard
            participants={room.participants}
            currentDrawerId={room.currentDrawerId}
            scores={room.scores}
          />
          <ResultPanel guesses={room.guesses} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            {isDrawer ? (
              <div>
                <div style={{ textAlign: 'center', padding: '8px', marginBottom: '8px' }}>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Your word to draw:</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{room.secretWord}</p>
                </div>
                <Canvas
                  strokes={room.canvasStrokes}
                  isDrawer={true}
                  onStrokeComplete={handleStrokeComplete}
                  onClear={handleClear}
                />
              </div>
            ) : (
              <Canvas
                strokes={room.canvasStrokes}
                isDrawer={false}
                onStrokeComplete={handleStrokeComplete}
                onClear={handleClear}
              />
            )}
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>
                  {viewer?.name ?? "Unknown player"}
                  {viewer?.isHost && <span className="player-list__badge">Host</span>}
                  {isDrawer && <span className="player-list__badge">Drawer</span>}
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{isDrawer ? "Drawing" : "Guessing"}</dd>
              </div>
            </dl>
          </Card>

          {!isDrawer && (
            <Card title="Your Guess">
              <GuessForm guessedCorrectly={hasGuessedCorrectly} pointsAwarded={viewerPointsAwarded} />
            </Card>
          )}
        </aside>
      </div>

      <div className="button-row">
        {isDrawer && (
          <>
            <button className="button button--primary" type="button" onClick={handleNextWord}>
              Next Word
            </button>
            <button className="button button--secondary" type="button" onClick={handleEndGame}>
              End Game
            </button>
          </>
        )}
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
