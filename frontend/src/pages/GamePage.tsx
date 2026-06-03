import { useEffect } from "react";
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
  const { room, participantId } = useRoomState();
  const roomStore = useRoomStore();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  // T030: Poll room state every 2 s while round is active
  useEffect(() => {
    if (!room || room.status !== "in-progress") return;
    const id = setInterval(() => {
      roomStore.fetchRoom();
    }, 2000);
    return () => clearInterval(id);
  }, [room?.status, roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((participant) => participant.id === room.drawerId) ?? null;
  const isDrawer = participantId === room.drawerId;
  const isActive = room.status === "in-progress";
  const guessDisabled = !isActive || room.hasGuessedCorrectly;

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>
      <p aria-live="polite" aria-atomic="true">
        {drawer ? `${drawer.name} is drawing` : "Waiting for drawer…"}
      </p>
      {isDrawer && room.currentWord ? (
        <p className="game-page__secret-word">Your word: <strong>{room.currentWord}</strong></p>
      ) : null}
      {room.status === "finished" ? (
        <p className="game-page__round-end" aria-live="polite">
          Round over!
        </p>
      ) : null}

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          {/* T039 */}
          <Scoreboard participants={room.participants} scores={room.scores} />
          {/* T043: ResultPanel with aria-live for guess feed */}
          <div aria-live="polite" aria-atomic="false">
            <ResultPanel guesses={room.guesses} />
          </div>
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            {/* T025/T029: DrawingCanvas — interactive for drawer, read-only for guesser */}
            <DrawingCanvas
              isDrawer={isDrawer}
              canvasDataUrl={room.canvasDataUrl}
              onCanvasChange={(dataUrl) => roomStore.updateCanvas(dataUrl)}
              onClear={() => roomStore.clearCanvas()}
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
            </dl>
          </Card>

          {/* T038: GuessForm — hidden for drawer, disabled when already correct or round over */}
          <Card title="Your Guess">
            <GuessForm
              isDrawer={isDrawer}
              disabled={guessDisabled}
              onSubmit={(text) => roomStore.submitGuess(text)}
            />
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
