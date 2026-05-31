import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (room && room.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(() => {
      roomStore.fetchRoom().catch(() => {});
    }, 2000);
  }, [roomStore]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (room) {
      startPolling();
    }
    return stopPolling;
  }, [room, startPolling, stopPolling]);

  async function handleStrokesChange(strokes: { points: { x: number; y: number }[] }[]) {
    try {
      await roomStore.saveStrokes(strokes);
    } catch {
      // silently fail — strokes will sync on next poll
    }
  }

  async function handleRestart() {
    try {
      await roomStore.restartGame();
    } catch {
      // poll will detect the restart state
    }
  }

  async function handleExit() {
    stopPolling();
    navigate("/lobby");
  }

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = participantId === room.drawerId;
  const isFinished = room.status === "finished";
  const isHost = participantId === room.hostId;

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">
            {isFinished ? "Round Over" : isDrawer ? "You are the Drawer" : "You are Guessing"}
          </span>
          <h1 className="game-page__title">
            {isFinished ? "The Round is Over!" : isDrawer ? "Draw the Word!" : "Guess the Word!"}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      {room.secretWord && (isDrawer || isFinished) ? (
        <Card title={isFinished ? "The Word Was" : "Your Secret Word"}>
          <p style={{ fontSize: "1.5rem", fontWeight: 700, textAlign: "center", letterSpacing: "0.05em" }}>
            {room.secretWord.toUpperCase()}
          </p>
        </Card>
      ) : null}

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <DrawingCanvas
              strokes={room.strokes}
              isDrawer={isDrawer && !isFinished}
              onStrokesChange={handleStrokesChange}
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
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
            </dl>
          </Card>

          {!isDrawer && !isFinished ? (
            <Card title="Your Guess">
              <GuessForm />
            </Card>
          ) : null}
        </aside>
      </div>

      <div className="button-row">
        {isFinished && isHost ? (
          <button className="button button--primary" onClick={handleRestart}>
            Restart Game
          </button>
        ) : null}
        <button className="button button--secondary" onClick={handleExit}>
          Exit to Lobby
        </button>
      </div>
    </section>
  );
}