import { useEffect, useState } from "react";
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
  const { room, participantId, error } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status !== "playing") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room || room.status !== "playing") {
      return undefined;
    }

    let isActive = true;
    const refreshGame = async () => {
      try {
        await roomStore.fetchRoom();
        if (isActive) {
          setRefreshError(null);
        }
      } catch (caughtError) {
        if (isActive) {
          setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh game");
        }
      }
    };

    const intervalId = window.setInterval(() => {
      void refreshGame();
    }, 2000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [room?.code, room?.status, roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.currentRound
    ? room.participants.find((participant) => participant.id === room.currentRound?.drawerParticipantId) ?? null
    : null;
  const roleLabel = room.viewerRole === "drawer" ? "Drawer" : "Guesser";

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {room.currentRound?.roundNumber ?? 1}</span>
          <h1 className="game-page__title">Guess the Word!</h1>
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
              strokes={room.currentRound?.canvas.strokes ?? []}
              isDrawer={room.isDrawer}
              onDraw={(stroke) => roomStore.submitDrawingStroke(stroke)}
              onClear={() => roomStore.clearDrawing()}
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
                <dd>Playing</dd>
              </div>
              <div>
                <dt>Your role</dt>
                <dd>
                  <span className={`role-badge ${room.isDrawer ? "role-badge--drawer" : "role-badge--guesser"}`}>
                    {roleLabel}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Drawer</dt>
                <dd>{room.currentRound?.drawerName ?? drawer?.name ?? "Selecting drawer"}</dd>
              </div>
            </dl>
          </Card>

          <Card title={room.isDrawer ? "Secret Word" : "Round Clue"}>
            {room.isDrawer ? (
              <div className="secret-word-panel">
                <span className="secret-word-panel__label">Draw this word</span>
                <strong>{room.secretWord ?? "Loading word..."}</strong>
              </div>
            ) : (
              <p>Watch {room.currentRound?.drawerName ?? "the drawer"} and submit your best guess. The secret word is hidden from guessers.</p>
            )}
          </Card>

          <Card title={room.isDrawer ? "Guesses" : "Your Guess"}>
            <GuessForm disabled={room.isDrawer} onSubmit={(guess) => roomStore.submitGuess(guess)} />
          </Card>
        </aside>
      </div>

      <p className={`game-page__polling ${refreshError || error ? "game-page__polling--error" : ""}`}>
        {refreshError ?? error ?? "Game refreshes automatically every 2 seconds."}
      </p>

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
