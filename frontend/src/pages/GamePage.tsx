import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useGamePolling } from "../hooks/useGamePolling";
import { useRoomState, useRoomStore } from "../state/roomStore";

function roleMetaClass(role?: "drawer" | "guesser") {
  if (role === "drawer") {
    return "player-list__meta player-list__meta--drawer";
  }

  if (role === "guesser") {
    return "player-list__meta player-list__meta--guesser";
  }

  return "player-list__meta";
}

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const pollError = useGamePolling();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "results") {
      navigate("/result", { replace: true });
    }
  }, [navigate, room, room?.status]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = room.viewerRole === "drawer";
  const strokes = room.strokes ?? [];

  async function handleStrokeComplete(stroke: (typeof strokes)[number]) {
    try {
      await roomStore.addStroke(stroke);
    } catch {
      // Poll will reconcile on next interval; avoid crashing the canvas.
    }
  }

  async function handleClearCanvas() {
    try {
      await roomStore.clearCanvas();
    } catch {
      // Errors surface on next explicit action or poll refresh.
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

      {pollError ? <p className="form__error">{pollError}</p> : null}

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard room={room} />
          <ResultPanel guesses={room.guesses} />

          <Card title="Participants">
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>{participant.name}</span>
                  <span className={roleMetaClass(participant.role)}>
                    {participant.role ?? "player"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>

        <div className="game-page__main">
          {isDrawer ? (
            <Card title="Secret Word">
              <p className="secret-word">{room.secretWord}</p>
            </Card>
          ) : null}

          <Card title="Canvas">
            <DrawingCanvas
              strokes={strokes}
              readOnly={!isDrawer}
              onStrokeComplete={isDrawer ? handleStrokeComplete : undefined}
            />
            {isDrawer ? (
              <div className="button-row button-row--compact">
                <button className="button button--secondary" type="button" onClick={handleClearCanvas}>
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
                <dd>{room.viewerRole ?? "unknown"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>Playing</dd>
              </div>
            </dl>
          </Card>

          <Card title="Your Guess">
            <GuessForm disabled={isDrawer} />
          </Card>
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
