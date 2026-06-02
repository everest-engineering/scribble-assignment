import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";
import type { Stroke } from "../services/api";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room) {
      return;
    }

    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room?.code, room?.status]);

  useEffect(() => {
    if (!room) {
      return;
    }

    const interval = setInterval(() => {
      roomStore.fetchRoom().catch(() => {});
    }, 2000);

    return () => clearInterval(interval);
  }, [roomStore, room?.code]);

  const handleStrokeComplete = useCallback(
    (stroke: Stroke) => {
      roomStore.drawStroke(stroke).catch(() => {});
    },
    [roomStore]
  );

  const handleClear = useCallback(() => {
    roomStore.clearDrawing().catch(() => {});
  }, [roomStore]);

  const handleGuess = useCallback(
    async (text: string) => {
      await roomStore.submitGuess(text);
    },
    [roomStore]
  );

  const handleRestart = useCallback(async () => {
    try {
      await roomStore.restartGame();
    } catch {
      // error handled by store
    }
  }, [roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((p) => p.id === participantId) ?? null;
  const isDrawer = participantId === room.drawerId;
  const isFinished = room.status === "finished";
  const isPlaying = room.status === "playing";

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
          <Scoreboard participants={room.participants} scores={room.scores} />
          <ResultPanel guesses={room.guesses} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <DrawingCanvas
              strokes={room.canvasStrokes}
              isDrawer={isDrawer}
              onStrokeComplete={handleStrokeComplete}
              onClear={handleClear}
            />
          </Card>
          {isFinished ? (
            <Card title="Round Over">
              <p>The word was: <strong>{room.secretWord ?? "???"}</strong></p>
            </Card>
          ) : null}
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
              {isDrawer && isPlaying ? (
                <div>
                  <dt>Your Word</dt>
                  <dd style={{ color: "#2563eb", fontWeight: 700 }}>{room.secretWord ?? "???"}</dd>
                </div>
              ) : null}
              <div>
                <dt>Status</dt>
                <dd>{room.status === "finished" ? "Finished" : isDrawer ? "Drawing" : "Guessing"}</dd>
              </div>
            </dl>
          </Card>

          {!isDrawer ? (
            <Card title="Your Guess">
              <GuessForm disabled={isFinished} onSubmit={handleGuess} />
            </Card>
          ) : null}
        </aside>
      </div>

      <div className="button-row">
        {isFinished && participantId === room.hostId ? (
          <button className="button button--primary" onClick={handleRestart}>
            Play Again
          </button>
        ) : null}
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
