import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { Canvas } from "../components/Canvas";
import type { CanvasStroke } from "../services/api";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const { room, participantId } = useRoomState();
  const store = useRoomStore();
  const [guessError, setGuessError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    store.startPolling();
  }, [navigate, room, store]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = room.currentRound !== null && participantId !== null && participantId === room.currentRound.drawerId;
  const roundNumber = room.currentRound?.number ?? 1;
  const currentRound = room.currentRound;
  const drawerParticipant = currentRound
    ? room.participants.find((p) => p.id === currentRound.drawerId) ?? null
    : null;

  function handleStroke(stroke: CanvasStroke) {
    const currentStrokes = room!.currentRound?.strokes ?? [];
    store.drawStroke([...currentStrokes, stroke]);
  }

  function handleClear() {
    store.clearCanvas();
  }

  const isCorrectGuesser =
    participantId !== null &&
    room.currentRound?.correctGuessers.includes(participantId);

  async function handleGuessSubmit(text: string) {
    setGuessError(null);

    try {
      await store.submitGuess(text);
    } catch (err) {
      setGuessError(err instanceof Error ? err.message : "Failed to submit guess");
    }
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {roundNumber}</span>
          <h1 className="game-page__title">{isDrawer ? "Draw the Word!" : "Guess the Word!"}</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard
            participants={room.participants}
            scores={room.currentRound?.scores ?? {}}
          />
          <ResultPanel
            guesses={room.currentRound?.guesses ?? []}
          />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <Canvas
              strokes={room.currentRound?.strokes ?? []}
              isDrawer={isDrawer}
              onStroke={handleStroke}
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
                <dd>{isDrawer ? <strong>Drawer</strong> : "Guesser"}</dd>
              </div>
              {drawerParticipant && (
                <div>
                  <dt>Current Drawer</dt>
                  <dd>{drawerParticipant.name} <strong>Drawer</strong></dd>
                </div>
              )}
            </dl>
          </Card>

          {isDrawer && room.currentRound ? (
            <Card title="Your Word">
              <p style={{ fontSize: "1.5rem", fontWeight: "bold", textAlign: "center" }}>
                {room.currentRound.secretWord}
              </p>
            </Card>
          ) : (
            <Card title="Your Guess">
              <GuessForm
                error={guessError}
                onSubmit={handleGuessSubmit}
                isCorrect={isCorrectGuesser}
              />
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
