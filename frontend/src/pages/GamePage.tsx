import { useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawerWordDisplay } from "../components/DrawerWordDisplay";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { GuessHistory } from "../components/GuessHistory";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";
import type { Stroke } from "../services/api";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  const startPolling = useCallback(() => {
    if (!room?.code) return;
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        await roomStore.fetchRoom();
      } catch {
        // retain stale data; retry on next cycle
      }
    }, 2000);
  }, [room?.code, roomStore]);

  useEffect(() => {
    startPolling();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [startPolling]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = !!room.drawerId && participantId === room.drawerId;
  const drawerParticipant = room.drawerId
    ? room.participants.find((p) => p.id === room.drawerId)
    : null;
  const drawerName = drawerParticipant?.name ?? "Unknown";

  async function handleStroke(stroke: Omit<Stroke, "id" | "playerId">) {
    try {
      await roomStore.addStroke(stroke);
    } catch {
      // ignore — polling will sync
    }
  }

  async function handleClear() {
    try {
      await roomStore.clearCanvas();
    } catch {
      // ignore — polling will sync
    }
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">{isDrawer ? "Draw the Word!" : "Guess the Word!"}</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard playerScores={room.playerScores} />
          <ResultPanel />
          <Card title="Guesses">
            <GuessHistory guesses={room.guesses} />
          </Card>
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            {isDrawer ? (
              <DrawingCanvas
                strokes={room.strokes}
                onStroke={handleStroke}
                onClear={handleClear}
              />
            ) : (
              <div className="canvas-placeholder" style={{ minHeight: "500px", backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                Waiting for {drawerName} to draw...
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
                <dt>Role</dt>
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
              {!isDrawer && (
                <div>
                  <dt>Drawing</dt>
                  <dd>{drawerName}</dd>
                </div>
              )}
            </dl>
          </Card>

          {isDrawer && (
            <Card title="Your Word">
              <DrawerWordDisplay word={room.currentWord} />
            </Card>
          )}

          {!isDrawer && (
            <Card title="Your Guess">
              <p className="guess-prompt">Guess the word {drawerName} is drawing!</p>
              <GuessForm
                roomCode={room.code}
                participantId={participantId ?? ""}
                onGuess={() => roomStore.fetchRoom()}
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
