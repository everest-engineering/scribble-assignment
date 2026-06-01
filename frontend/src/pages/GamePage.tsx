import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "../components/Canvas";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { usePolling, useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [actionError, setActionError] = useState<string | null>(null);

  usePolling(true);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  const handleGuess = useCallback(async (word: string) => {
    setActionError(null);
    await roomStore.submitGuess(word);
  }, [roomStore]);

  const handleCanvasUpdate = useCallback(async (dataUrl: string) => {
    if (!room || !participantId) return;
    try {
      await roomStore.updateCanvas(dataUrl);
    } catch {
      // silent - canvas sync is best-effort
    }
  }, [room, participantId, roomStore]);

  const handleRestart = useCallback(async () => {
    try {
      setActionError(null);
      await roomStore.restartGame();
      navigate("/lobby");
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to restart");
    }
  }, [roomStore, navigate]);

  if (!room || !participantId) {
    return null;
  }

  const viewer = room.participants.find((p) => p.id === participantId) ?? null;
  const isDrawer = participantId === room.drawerId;
  const isHost = participantId === room.hostId;
  const isRoundEnd = room.status === "round_end";
  const isPlaying = room.status === "playing";

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {room.round || 1}</span>
          <h1 className="game-page__title">
            {isDrawer ? "Draw the Word!" : "Guess the Word!"}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} scores={room.scores} />
          <ResultPanel guesses={room.guesses} secretWord={room.secretWord} status={room.status} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <Canvas
              isDrawer={isDrawer}
              canvasData={room.canvasData}
              onCanvasUpdate={handleCanvasUpdate}
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
                <dd>{isDrawer ? "DRAWER" : "Guesser"}</dd>
              </div>
              <div>
                <dt>Word</dt>
                <dd>{isDrawer && room.secretWord ? room.secretWord : isRoundEnd && room.secretWord ? room.secretWord : "???"}</dd>
              </div>
            </dl>
          </Card>

          {isDrawer ? (
            <Card title="Your Word">
              <div className="placeholder-block">
                <p style={{ fontSize: "1.25rem", fontWeight: 700, textAlign: "center" }}>
                  {room.secretWord ?? "???"}
                </p>
              </div>
            </Card>
          ) : isPlaying ? (
            <Card title="Your Guess">
              <GuessForm disabled={isRoundEnd} onGuess={handleGuess} />
            </Card>
          ) : null}

          {actionError ? <p className="form__error">{actionError}</p> : null}
        </aside>
      </div>

      <div className="button-row">
        {isRoundEnd && isHost ? (
          <button className="button button--primary" onClick={handleRestart}>
            Restart Game
          </button>
        ) : isRoundEnd ? (
          <p className="waiting-message">Waiting for the host to restart...</p>
        ) : null}
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
