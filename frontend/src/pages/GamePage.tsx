import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomPolling } from "../hooks/useRoomPolling";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading } = useRoomState();
  const [restartError, setRestartError] = useState<string | null>(null);

  const isHost = Boolean(room && participantId && room.hostId === participantId);
  const isDrawer = Boolean(room && participantId && room.drawerId === participantId);
  const isPlaying = room?.status === "playing";
  const isResult = room?.status === "result";

  useRoomPolling({
    enabled: Boolean(room && (room.status === "playing" || room.status === "result")),
    intervalMs: 2000
  });

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

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((participant) => participant.id === room.drawerId) ?? null;

  async function handleRestart() {
    try {
      setRestartError(null);
      await roomStore.restartGame();
      navigate("/lobby");
    } catch (caughtError) {
      setRestartError(caughtError instanceof Error ? caughtError.message : "Unable to restart game");
    }
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">
            {isResult ? "Round Over" : isDrawer ? `Draw: ${room.secretWord ?? "..."}` : "Guess the Word!"}
          </h1>
          {drawer ? (
            <p style={{ color: "#6b7280", marginTop: "4px" }}>
              Drawer: {drawer.name}
              {isDrawer ? " (you)" : ""}
            </p>
          ) : null}
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      {error || restartError ? <p className="form__error">{error ?? restartError}</p> : null}

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} scores={room.scores} />
          <ResultPanel
            status={isResult ? "result" : "playing"}
            revealedWord={room.revealedWord}
            guesses={room.guesses}
            isHost={isHost}
            onRestart={handleRestart}
            isRestarting={isLoading}
          />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            {isPlaying && !isDrawer ? (
              <p style={{ marginBottom: "8px", color: "#6b7280" }}>Drawer is drawing…</p>
            ) : null}
            <DrawingCanvas
              strokes={room.strokes}
              canDraw={isPlaying && isDrawer}
              disabled={!isPlaying}
              onStrokeComplete={(stroke) => {
                void roomStore.addStroke(stroke);
              }}
              onClear={() => {
                void roomStore.clearCanvas();
              }}
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
                <dd>{isDrawer ? "Drawer" : isPlaying ? "Guesser" : isResult ? "Spectating result" : "Waiting"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{room.status}</dd>
              </div>
            </dl>
          </Card>

          {isPlaying && !isDrawer ? (
            <Card title="Your Guess">
              <GuessForm
                onSubmitGuess={async (guess) => {
                  await roomStore.submitGuess(guess);
                }}
              />
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
