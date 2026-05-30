import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "../components/Canvas";
import { Card } from "../components/Card";
import { DrawerIndicator } from "../components/DrawerIndicator";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";
import type { Stroke } from "../services/api";

export function GamePage() {
  const navigate = useNavigate();
  const { room, participantId, error, pollError } = useRoomState();
  const store = useRoomStore();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = participantId != null && participantId === room.drawerId;

  const handleStroke = useCallback(
    async (stroke: Stroke) => {
      try {
        await store.updateCanvas([stroke]);
      } catch {
        // error handled by store
      }
    },
    [store]
  );

  const handleClear = useCallback(async () => {
    try {
      await store.clearCanvas();
    } catch {
      // error handled by store
    }
  }, [store]);

  const handleGuess = useCallback(
    async (text: string) => {
      await store.submitGuess(text);
    },
    [store]
  );

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {room.roundNumber ?? 1}</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      {error ? (
        <div style={{ padding: "8px 16px", background: "#fef2f2", color: "#dc2626", borderRadius: 8, marginBottom: 12, fontSize: "0.875rem", fontWeight: 500 }}>
          {error}
        </div>
      ) : null}

      {pollError ? (
        <div style={{ padding: "8px 16px", background: "#fffbeb", color: "#d97706", borderRadius: 8, marginBottom: 12, fontSize: "0.875rem", fontWeight: 500 }}>
          {pollError}
        </div>
      ) : null}

      <DrawerIndicator
        drawerId={room.drawerId}
        currentParticipantId={participantId}
        participants={room.participants}
      />

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} scores={room.scores} />
          <ResultPanel guesses={room.guesses} />
        </aside>

        <div className="game-page__main">
          {isDrawer && room.currentWord ? (
            <Card title="Your Word">
              <div className="word-display">{room.currentWord}</div>
            </Card>
          ) : null}

          <Card title="Canvas">
            <Canvas
              strokes={room.strokes}
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
                <dt>Status</dt>
                <dd>{isDrawer ? "Drawing" : "Guessing"}</dd>
              </div>
            </dl>
          </Card>

          {!isDrawer ? (
            <Card title="Your Guess">
              <GuessForm onSubmit={handleGuess} />
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
