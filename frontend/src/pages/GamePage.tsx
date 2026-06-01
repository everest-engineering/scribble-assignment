import { useCallback, useEffect, useRef, useState } from "react";
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [guessFeedback, setGuessFeedback] = useState<{ isCorrect: boolean } | null>(null);

  const handleStrokesSubmit = useCallback(async (strokes: import("../services/api").DrawingStroke[]) => {
    try {
      await roomStore.submitStrokes(strokes);
    } catch {
      // silently fail
    }
  }, [roomStore]);

  const handleClear = useCallback(async () => {
    try {
      await roomStore.clearStrokes();
    } catch {
      // silently fail
    }
  }, [roomStore]);

  const handleGuessSubmit = useCallback(async (text: string) => {
    try {
      const result = await roomStore.submitGuess(text);
      if (result) {
        setGuessFeedback({ isCorrect: result.isCorrect });
      }
    } catch {
      setGuessFeedback(null);
    }
  }, [roomStore]);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
      return;
    }

    intervalRef.current = setInterval(async () => {
      try {
        await roomStore.fetchRoom();
      } catch {
        // Polling error silently retries
      }
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [navigate, roomStore, room]);

  useEffect(() => {
    setGuessFeedback(null);
  }, [room?.guesses.length]);

  async function handleExit() {
    try {
      await roomStore.leaveGame();
    } catch {
      // Leave even if API call fails
    }
    navigate("/", { replace: true });
  }

  async function handleReveal() {
    try {
      await roomStore.revealWord();
    } catch {
      // silently fail
    }
  }

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = room.yourRole === "drawer";
  const isRoundEnded = room.status === "round_ended";

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
          <Scoreboard scores={room.scores} />
          <ResultPanel guesses={room.guesses} participants={room.participants} />
        </aside>

        <div className="game-page__main">
          <Card title="Your Role">
            <div className={`role-badge role-badge--${isDrawer ? "drawer" : "guesser"}`}>
              {isDrawer ? "You are the Drawer" : `You are a Guesser`}
            </div>
          </Card>

          {room.secretWord ? (
            <Card title="Secret Word">
              <div className="secret-word-display">{room.secretWord}</div>
            </Card>
          ) : (
            <Card title="Secret Word">
              <div className="secret-word-display secret-word-display--hidden">
                Word has been selected
              </div>
            </Card>
          )}

          <Card title="Canvas">
            {isRoundEnded ? (
              <div className="canvas-placeholder" style={{ minHeight: '500px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: '1rem', color: '#374151' }}>Round ended! The word was: <strong>{room.secretWord}</strong></p>
              </div>
            ) : (
              <DrawingCanvas
                isDrawer={isDrawer}
                serverStrokes={room.strokes}
                clearVersion={room.clearVersion}
                onStrokesSubmit={handleStrokesSubmit}
                onClear={handleClear}
              />
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
                <dt>Status</dt>
                <dd>{isRoundEnded ? "Round Ended" : "Playing"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
            </dl>
          </Card>

          {!isDrawer && !isRoundEnded ? (
            <Card title="Your Guess">
              <GuessForm onSubmit={handleGuessSubmit} feedback={guessFeedback} />
            </Card>
          ) : null}
        </aside>
      </div>

      <div className="button-row">
        {isDrawer && !isRoundEnded ? (
          <button className="button button--primary" onClick={handleReveal}>
            Reveal Word
          </button>
        ) : null}
        <button className="button button--secondary" onClick={handleExit}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
