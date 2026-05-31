import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { GuessHistory } from "../components/GuessHistory";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

const GAME_POLL_INTERVAL_MS = 2000;

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [error, setError] = useState<string | null>(null);

  const isDrawer = Boolean(room && participantId && room.drawerId === participantId);
  const drawer = room?.participants.find((participant) => participant.id === room.drawerId);

  useEffect(() => {
    if (!room || !participantId) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status !== "playing") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, participantId, room, room?.status]);

  useEffect(() => {
    if (!room || room.status !== "playing") {
      return;
    }

    let cancelled = false;

    async function pollRoom() {
      try {
        await roomStore.fetchRoom();
        if (!cancelled) {
          setError(null);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
        }
      }
    }

    void pollRoom();
    const intervalId = window.setInterval(() => {
      void pollRoom();
    }, GAME_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [room, room?.code, room?.status, roomStore]);

  const handleStrokeComplete = useCallback(
    async (stroke: Parameters<typeof roomStore.appendStroke>[0]) => {
      try {
        setError(null);
        await roomStore.appendStroke(stroke);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to save stroke");
      }
    },
    [roomStore]
  );

  const handleClear = useCallback(async () => {
    try {
      setError(null);
      await roomStore.clearDrawing();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to clear canvas");
    }
  }, [roomStore]);

  const handleSubmitGuess = useCallback(
    async (guess: string) => {
      await roomStore.submitGuess(guess);
    },
    [roomStore]
  );

  if (!room || !participantId || room.status !== "playing") {
    return null;
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">Guess the Word!</h1>
          <p>
            <strong>Drawer:</strong> {drawer?.name ?? "Unknown"}
            {isDrawer ? " (you)" : ""}
          </p>
          {isDrawer && room.secretWord ? (
            <p>
              <strong>Your word:</strong> {room.secretWord}
            </p>
          ) : null}
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard room={room} />
          <GuessHistory guesses={room.guesses} />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <DrawingCanvas
              strokes={room.strokes}
              interactive={isDrawer}
              onStrokeComplete={isDrawer ? handleStrokeComplete : undefined}
              onClear={isDrawer ? handleClear : undefined}
            />
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
            </dl>
          </Card>

          {!isDrawer ? (
            <Card title="Your Guess">
              <GuessForm onSubmitGuess={handleSubmitGuess} />
            </Card>
          ) : null}
        </aside>
      </div>

      {error ? <p className="form__error">{error}</p> : null}

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
