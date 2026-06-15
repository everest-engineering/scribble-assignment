import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [error, setError] = useState<string | null>(null);

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
      navigate("/lobby");
      return;
    }

    const intervalId = window.setInterval(() => {
      roomStore.fetchRoom().catch(() => undefined);
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [navigate, room, roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isHost = room.hostId === participantId;
  const isDrawer = room.viewerRole === "drawer";
  const hasFinishedRound = room.canRestartGame;
  const isGuessingAllowed = room.status === "active" && !isDrawer && !hasFinishedRound;
  const canClearCanvas = isDrawer && !hasFinishedRound;
  const canRestart = isHost && hasFinishedRound;

  async function handleClearCanvas() {
    try {
      setError(null);
      await roomStore.clearCanvas();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to clear canvas");
    }
  }

  async function handleRestart() {
    try {
      setError(null);
      const updatedRoom = await roomStore.restartRoom();
      if (updatedRoom.status === "lobby") {
        navigate("/lobby");
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to restart game");
    }
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
          <Scoreboard />
          <ResultPanel guesses={room.guesses} secretWord={room.secretWord} isRoundFinished={hasFinishedRound} />
          <Card title="Your Role">
            <p>{isDrawer ? "Drawer" : "Guesser"}</p>
            {isDrawer ? (
              <p style={{ marginTop: '8px' }}>
                Secret word: <strong>{room.secretWord}</strong>
              </p>
            ) : (
              <p style={{ marginTop: '8px' }}>
                Your word is hidden until the round ends.
              </p>
            )}
          </Card>
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <div className="canvas-placeholder" style={{ minHeight: '500px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
              {room.canvasCleared ? "The canvas was cleared by the drawer." : "Waiting for the drawer to sketch..."}
            </div>
            {canClearCanvas ? (
              <div className="button-row" style={{ marginTop: '12px' }}>
                <button className="button button--secondary" type="button" onClick={handleClearCanvas}>
                  Clear Canvas
                </button>
              </div>
            ) : null}
            {error ? <p className="form__error" style={{ marginTop: '12px' }}>{error}</p> : null}
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
                <dt>Status</dt>
                <dd>{hasFinishedRound ? "Round complete" : isDrawer ? "Drawing" : "Guessing"}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Your Guess">
            <GuessForm disabled={!isGuessingAllowed} onSubmit={roomStore.submitGuess.bind(roomStore)} />
          </Card>
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
        {canRestart ? (
          <button className="button button--primary" onClick={handleRestart}>
            Restart Round
          </button>
        ) : null}
      </div>
    </section>
  );
}
