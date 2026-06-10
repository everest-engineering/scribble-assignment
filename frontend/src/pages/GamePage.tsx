import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";
import type { Point } from "../services/api";

export function GamePage() {
  const navigate = useNavigate();
  const store = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  // 2-second polling for guess history, scores, canvas strokes, and state transitions
  useEffect(() => {
    if (!room) return;

    const interval = setInterval(async () => {
      const polled = await store.pollRoom();
      if (polled?.status === "result") {
        navigate("/result");
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [store, navigate, room?.code]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = viewer?.name === room.drawerName;
  const isHost = viewer?.isHost ?? false;

  function handleStrokeComplete(points: Point[]) {
    store.addStroke(points);
  }

  function handleClear() {
    store.clearStrokes();
  }

  function handleGuessSubmit(guess: string) {
    if (viewer) {
      store.submitGuess(viewer.name, guess);
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
          <Scoreboard scores={room.scores} participants={room.participants} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <DrawingCanvas
              strokes={room.strokes}
              readOnly={!isDrawer}
              onStrokeComplete={isDrawer ? handleStrokeComplete : undefined}
            />
            {isDrawer && (
              <div className="button-row button-row--compact">
                <button className="button button--secondary" onClick={handleClear}>
                  Clear
                </button>
              </div>
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
                <dd>{isDrawer ? "Drawing" : "Guessing"}</dd>
              </div>
              {room.secretWord && (
                <div>
                  <dt>Secret Word</dt>
                  <dd>{room.secretWord}</dd>
                </div>
              )}
            </dl>
          </Card>

          {!isDrawer && (
            <Card title="Your Guess">
              <GuessForm onSubmit={handleGuessSubmit} />
            </Card>
          )}

          <Card title="Guess History">
            {room.guesses.length === 0 ? (
              <p className="placeholder-block">No guesses yet...</p>
            ) : (
              <ul className="detail-list">
                {room.guesses.map((guess, index) => (
                  <li key={index}>
                    <span>{guess.playerName}: </span>
                    <span>{guess.text}</span>
                    <strong> ({guess.points} pts)</strong>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>

      <div className="button-row">
        {isHost && (
          <button
            className="button button--primary"
            onClick={async () => {
              if (viewer) {
                await store.endGame(viewer.name);
                navigate("/result");
              }
            }}
          >
            End Game
          </button>
        )}
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
