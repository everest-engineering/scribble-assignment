import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL = 2000;

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  const doPoll = useCallback(async () => {
    try {
      await roomStore.fetchRoom();
    } catch {
      // silent
    }
  }, [roomStore]);

  useEffect(() => {
    if (!room) {
      return;
    }

    doPoll();
    pollRef.current = setInterval(doPoll, POLL_INTERVAL);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [room?.code, doPoll]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = viewer?.isDrawer ?? false;
  const isFinished = room.status === "finished";

  async function handleSaveDrawing(dataUrl: string) {
    await roomStore.saveDrawing(dataUrl);
  }

  async function handleSubmitGuess(text: string) {
    await roomStore.submitGuess(text);
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">
            {isFinished ? "Round Over!" : "Guess the Word!"}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} />
          <ResultPanel guesses={room.guesses} />
        </aside>

        <div className="game-page__main">
          <Card title={isDrawer && !isFinished ? `Your Word: ${room.word ?? "..."}` : "Canvas"}>
            <DrawingCanvas
              drawingData={room.drawingData}
              isDrawer={isDrawer}
              onSaveDrawing={handleSaveDrawing}
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
              <div>
                <dt>Score</dt>
                <dd>{viewer?.score ?? 0}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Your Guess">
            <GuessForm disabled={isDrawer || isFinished} onSubmitGuess={handleSubmitGuess} />
          </Card>

          {isFinished && (
            <Card title="Result">
              <p style={{ fontSize: "0.875rem" }}>
                The word was: <strong>{room.word ?? "???"}</strong>
              </p>
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
