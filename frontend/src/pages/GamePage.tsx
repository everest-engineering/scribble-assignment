import { useEffect, useRef, useState } from "react";
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
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room || room.status !== "inGame") {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    if (pollingRef.current) {
      return;
    }

    async function poll() {
      try {
        await roomStore.fetchRoom();
        setRefreshError(null);
      } catch {
        // Non-destructive refresh errors — keep last known snapshot
      }
    }

    pollingRef.current = setInterval(poll, 2000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [room, roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.currentRound
    ? room.participants.find((p) => p.id === room.currentRound!.drawerParticipantId) ?? null
    : null;

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {room.currentRound?.roundNumber ?? 1}</span>
          <h1 className="game-page__title">{room.isDrawer ? "Draw the Word!" : "Guess the Word!"}</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard scores={room.scores ?? []} />
          <ResultPanel guesses={room.currentRound?.guesses ?? []} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <CanvasBoard
              isDrawer={room.isDrawer}
              strokes={room.currentRound?.canvas?.strokes ?? []}
              onDraw={(stroke) => { roomStore.submitDrawingStroke(stroke); }}
              onClear={() => { roomStore.clearDrawing(); }}
            />
            {room.isDrawer ? (
              <div className="button-row">
                <button className="button button--secondary" onClick={() => roomStore.clearDrawing()}>
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
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>
                  <span className={`role-badge role-badge--${room.viewerRole}`}>
                    {room.viewerRole}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Drawer</dt>
                <dd>{drawer?.name ?? "Unknown"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{room.status === "inGame" ? "Playing" : room.status}</dd>
              </div>
            </dl>
            {error || refreshError ? (
              <p className="form__error">{error ?? refreshError}</p>
            ) : null}
          </Card>

          {room.isDrawer && room.secretWord ? (
            <Card title="Secret Word">
              <p className="secret-word">{room.secretWord}</p>
            </Card>
          ) : null}

          {!room.isDrawer ? (
            <Card title="Your Guess">
              <GuessForm onSubmit={(guess) => roomStore.submitGuess(guess)} />
            </Card>
          ) : (
            <Card title="Instructions">
              <p className="instruction-text">Draw the word above so your teammates can guess it!</p>
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
