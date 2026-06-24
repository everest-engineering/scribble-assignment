import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import type { DrawingStroke } from "../services/api";
import { useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL_MS = 2000;

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, isLoading } = useRoomState();
  const [pollError, setPollError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isHost = room && participantId ? room.hostId === participantId : false;

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

  const pollRoom = useCallback(async () => {
    try {
      setPollError(null);
      await roomStore.fetchRoom();
    } catch (caughtError) {
      setPollError(caughtError instanceof Error ? caughtError.message : "Unable to refresh game");
    }
  }, [roomStore]);

  useEffect(() => {
    if (!room || (room.status !== "playing" && room.status !== "result")) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void pollRoom();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [room, pollRoom]);

  async function handleStrokeComplete(stroke: DrawingStroke) {
    try {
      setActionError(null);
      await roomStore.addStroke(stroke);
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to save stroke");
    }
  }

  async function handleClearDrawing() {
    try {
      setActionError(null);
      await roomStore.clearDrawing();
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to clear canvas");
    }
  }

  async function handleSubmitGuess(text: string) {
    await roomStore.submitGuess(text);
  }

  async function handleRestart() {
    try {
      setActionError(null);
      await roomStore.restartGame();
      navigate("/lobby");
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to restart game");
    }
  }

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((participant) => participant.id === room.drawerId) ?? null;
  const isDrawer = viewer?.role === "drawer";
  const isPlaying = room.status === "playing";

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">{room.status === "result" ? "Round Complete" : "Round 1"}</span>
          <h1 className="game-page__title">
            {room.status === "result" ? "Results" : "Guess the Word!"}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      {pollError ? <p className="form__error">{pollError}</p> : null}
      {actionError ? <p className="form__error">{actionError}</p> : null}

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} />
          <ResultPanel
            status={room.status}
            secretWord={room.secretWord}
            participants={room.participants}
            guesses={room.guesses}
          />
        </aside>

        <div className="game-page__main">
          {isDrawer && room.secretWord && isPlaying ? (
            <Card title="Secret Word">
              <p className="status-line" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
                Draw: <strong>{room.secretWord}</strong>
              </p>
            </Card>
          ) : null}

          <Card title="Canvas">
            <DrawingCanvas
              strokes={room.drawingStrokes}
              canDraw={isDrawer && isPlaying}
              onStrokeComplete={handleStrokeComplete}
              onClear={handleClearDrawing}
            />
          </Card>

          <Card title="Guess History">
            {room.guesses.length === 0 ? (
              <p>No guesses yet.</p>
            ) : (
              <ul className="player-list">
                {room.guesses.map((guess) => (
                  <li key={guess.id}>
                    <span>
                      {guess.participantName}: {guess.text}
                    </span>
                    <span className="player-list__meta">{guess.isCorrect ? "correct" : "wrong"}</span>
                  </li>
                ))}
              </ul>
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
                <dt>Role</dt>
                <dd>{viewer?.role === "drawer" ? "Drawer" : "Guesser"}</dd>
              </div>
              <div>
                <dt>Drawer</dt>
                <dd>{drawer?.name ?? "Unknown"}</dd>
              </div>
            </dl>
          </Card>

          {isPlaying ? (
            <Card title="Your Guess">
              <GuessForm disabled={isDrawer} onSubmitGuess={handleSubmitGuess} />
            </Card>
          ) : null}
        </aside>
      </div>

      <div className="button-row">
        {room.status === "result" && isHost ? (
          <button className="button button--primary" disabled={isLoading} onClick={handleRestart}>
            {isLoading ? "Restarting..." : "Restart Game"}
          </button>
        ) : null}
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
