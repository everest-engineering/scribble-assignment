import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CanvasBoard } from "../components/CanvasBoard";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room) {
      return;
    }

    roomStore.enablePolling();

    return () => {
      roomStore.disablePolling();
    };
  }, [room?.code, roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const host = room.participants[0] ?? null;
  const drawer = room.participants.find((participant) => participant.id === room.drawerParticipantId) ?? null;
  const isDrawer = participantId !== null && participantId === room.drawerParticipantId;
  const isRoundEnded = room.roundPhase === "ended";
  const canSeeSecretWord = isDrawer || isRoundEnded;
  const secretWord = canSeeSecretWord ? room.secretWord ?? "Unknown word" : null;

  async function handleDrawStroke(stroke: { points: Array<{ x: number; y: number }>; color: string; lineWidth: number }) {
    await roomStore.drawCanvas(stroke);
  }

  async function handleClearCanvas() {
    await roomStore.clearCanvas();
  }

  async function handleGuessSubmit(guessText: string) {
    await roomStore.submitGuess(guessText);
  }

  async function handleRestartGame() {
    try {
      await roomStore.restartRoom();
    } catch {
      // The store already records the error for display.
    }
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">{isRoundEnded ? "Round complete" : "Round 1"}</span>
          <h1 className="game-page__title">{isRoundEnded ? "Round Summary" : "Guess the Word!"}</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <CanvasBoard
              canvasEvents={room.canvasEvents}
              isDrawer={isDrawer}
              disabled={isLoading || isRoundEnded}
              onDrawStroke={handleDrawStroke}
              onClear={handleClearCanvas}
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
                <dd>{isRoundEnded ? "Round complete" : room.status === "game" ? "Playing" : "Waiting in lobby"}</dd>
              </div>
              <div>
                <dt>Host</dt>
                <dd>{host?.name ?? "Unknown host"}</dd>
              </div>
              <div>
                <dt>Drawer</dt>
                <dd>{drawer?.name ?? "Waiting for drawer"}</dd>
              </div>
              <div>
                <dt>Secret Word</dt>
                <dd>{canSeeSecretWord ? secretWord : "Hidden from guessers"}</dd>
              </div>
              {error ? (
                <div>
                  <dt>Message</dt>
                  <dd>{error}</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          {!isDrawer && !isRoundEnded ? (
            <Card title="Your Guess">
              <GuessForm error={error} disabled={isLoading} onSubmit={handleGuessSubmit} />
            </Card>
          ) : null}
        </aside>
      </div>

      <div className="button-row">
        {isRoundEnded && participantId === host?.id ? (
          <button className="button button--primary" disabled={isLoading} onClick={() => void handleRestartGame()}>
            Restart Game
          </button>
        ) : null}
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
