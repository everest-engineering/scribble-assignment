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
  const { room, participantId, isLoading } = useRoomState();
  const [actionError, setActionError] = useState<string | null>(null);

  const isPlaying = room?.status === "playing";
  const isResult = room?.status === "result";
  const shouldPoll = Boolean(room && (isPlaying || isResult));

  useRoomPolling(2000, shouldPoll);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room]);

  if (!room || !participantId) {
    return null;
  }

  const isDrawer = room.drawerId === participantId;
  const isHost = room.isHost;
  const drawer = room.participants.find((participant) => participant.id === room.drawerId);

  async function handleClearCanvas() {
    try {
      setActionError(null);
      await roomStore.clearCanvas();
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to clear canvas");
    }
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

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">
            {isResult ? "Round Complete" : "Guess the Word!"}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      {isResult && room.secretWord ? (
        <div className="result-banner">
          <p>
            The word was: <strong>{room.secretWord}</strong>
          </p>
        </div>
      ) : null}

      {actionError ? <p className="form__error">{actionError}</p> : null}

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Card title="Scoreboard">
            <Scoreboard participants={room.participants} />
          </Card>
          <Card title="Guess History">
            <ResultPanel guesses={room.guesses} />
          </Card>
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            {isDrawer && isPlaying && room.secretWord ? (
              <p className="secret-word">
                Draw: <strong>{room.secretWord}</strong>
              </p>
            ) : null}
            {!isDrawer && isPlaying ? (
              <p className="canvas-hint">Watch the drawing and guess!</p>
            ) : null}
            <DrawingCanvas strokes={room.strokes} canDraw={isDrawer && isPlaying} />
            {isDrawer && isPlaying ? (
              <div className="button-row">
                <button className="button button--secondary" disabled={isLoading} onClick={handleClearCanvas}>
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
                <dd>{room.participants.find((p) => p.id === participantId)?.name ?? "Unknown"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
              <div>
                <dt>Drawer</dt>
                <dd>{drawer?.name ?? "Unknown"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{room.status}</dd>
              </div>
            </dl>
          </Card>

          {isPlaying && !isDrawer ? (
            <Card title="Your Guess">
              <GuessForm />
            </Card>
          ) : null}

          {isResult && isHost ? (
            <Card title="Next Steps">
              <button className="button button--primary" disabled={isLoading} onClick={handleRestart}>
                Restart to Lobby
              </button>
            </Card>
          ) : null}

          {isResult && !isHost ? (
            <Card title="Next Steps">
              <p>Waiting for the host to restart...</p>
            </Card>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
