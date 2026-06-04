import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "../components/Canvas";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import type { Stroke } from "../services/api";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doPoll = useCallback(async () => {
    try {
      await roomStore.fetchRoom();
    } catch {
      // polling errors are non-fatal
    }
  }, [roomStore]);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }
  }, [navigate, room]);

  useEffect(() => {
    doPoll();
    pollingRef.current = setInterval(doPoll, 2000);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [doPoll]);

  useEffect(() => {
    if (room && room.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = participantId === room.drawerId;
  const isResult = room.status === "result";

  async function handleDraw(stroke: Stroke) {
    try {
      await roomStore.drawStroke(stroke);
    } catch {
      // drawing errors non-fatal
    }
  }

  async function handleClear() {
    try {
      await roomStore.clearCanvas();
    } catch {
      // clear errors non-fatal
    }
  }

  async function handleGuess(text: string) {
    await roomStore.submitGuess(text);
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {room.round}</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} scores={room.scores} />
          <ResultPanel guesses={room.guesses} secretWord={isResult ? room.secretWord : undefined} status={room.status} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <Canvas
              strokes={room.strokes}
              isDrawer={isDrawer}
              secretWord={room.secretWord}
              onDraw={handleDraw}
              onClear={handleClear}
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

          {!isDrawer && !isResult ? (
            <Card title="Your Guess">
              <GuessForm onSubmit={handleGuess} />
            </Card>
          ) : null}
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
