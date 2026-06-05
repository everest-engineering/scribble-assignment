import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";
import type { Stroke } from "../services/api";

const POLL_INTERVAL_MS = 2000;

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  // Keep the game state synced across players (~2s). Failures are non-fatal.
  useEffect(() => {
    if (!room) {
      return;
    }

    const interval = setInterval(() => {
      roomStore.fetchRoom().catch(() => undefined);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [room, roomStore]);

  // On restart the room returns to the lobby; send every player back there.
  useEffect(() => {
    if (room?.status === "lobby") {
      navigate("/lobby");
    }
  }, [navigate, room?.status]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = room.drawerId === participantId;
  const isHost = room.hostId === participantId;
  const isFinished = room.status === "finished";

  function handleStrokeComplete(stroke: Stroke) {
    roomStore.addStroke(stroke).catch(() => undefined);
  }

  function handleClearCanvas() {
    roomStore.clearCanvas().catch(() => undefined);
  }

  async function handleGuess(text: string) {
    await roomStore.submitGuess(text);
  }

  function handleRestart() {
    roomStore.restartGame().then(() => navigate("/lobby"), () => undefined);
  }

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
          <ResultPanel guesses={room.guesses} finished={isFinished} word={room.word} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <DrawingCanvas
              strokes={room.strokes}
              canDraw={isDrawer}
              onStrokeComplete={handleStrokeComplete}
            />
            {isDrawer ? (
              <div className="button-row button-row--compact">
                <button className="button button--secondary" onClick={handleClearCanvas}>
                  Clear Canvas
                </button>
              </div>
            ) : null}
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

          {isFinished ? (
            <Card title="Round Over">
              <p className="secret-word">{room.word ?? "—"}</p>
              <p className="secret-word__hint">
                {isHost ? "Restart to play again with the same players." : "Waiting for the host to restart…"}
              </p>
            </Card>
          ) : isDrawer ? (
            <Card title="Your Secret Word">
              <p className="secret-word">{room.word ?? "…"}</p>
              <p className="secret-word__hint">Only you can see this. Draw it!</p>
            </Card>
          ) : (
            <Card title="Your Guess">
              <GuessForm onGuess={handleGuess} />
            </Card>
          )}
        </aside>
      </div>

      <div className="button-row">
        {isFinished && isHost ? (
          <button className="button button--primary" onClick={handleRestart}>
            Restart Game
          </button>
        ) : null}
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
