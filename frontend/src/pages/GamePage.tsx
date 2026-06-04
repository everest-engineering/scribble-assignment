import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { CanvasBoard } from "../components/CanvasBoard";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void roomStore.fetchRoom().catch(() => {});
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [room, roomStore]);

  const handleSubmitGuess = useCallback(
    (guess: string) => roomStore.submitGuess(guess),
    [roomStore]
  );

  if (!room) {
    return null;
  }

  const viewer =
    room.participants.find(
      (participant) => participant.id === participantId
    ) ?? null;

  const drawer =
    room.participants.find(
      (participant) => participant.id === room.drawerId
    ) ?? null;

  const isDrawer = room.drawerId === participantId;

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
          <ResultPanel guesses={room.guesses} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <CanvasBoard disabled={!isDrawer} />
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

              <div>
                <dt>Current Drawer</dt>
                <dd>{drawer?.name ?? "Unknown"}</dd>
              </div>

              <div>
                <dt>Status</dt>
                <dd>Playing</dd>
              </div>

              {isDrawer ? (
                <div>
                  <dt>Secret Word</dt>
                  <dd>{room.secretWord ?? "No word assigned"}</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <Card title="Your Guess">
            <GuessForm disabled={isDrawer} onSubmitGuess={handleSubmitGuess} />
          </Card>
        </aside>
      </div>

      <div className="button-row">
        <button
          className="button button--secondary"
          onClick={() => navigate("/lobby")}
        >
          Exit Game
        </button>
      </div>
    </section>
  );
}