import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
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

  // Automatic 2-second polling — same cadence as lobby
  useEffect(() => {
    if (!room) return;

    const intervalId = setInterval(() => {
      roomStore.fetchRoom().catch(() => {
        // error surfaces through store state
      });
    }, 2000);

    return () => clearInterval(intervalId);
  }, [room?.code, roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((participant) => participant.id === room.drawerId) ?? null;
  const isDrawer = participantId === room.drawerId;

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
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <div
              className="canvas-placeholder"
              style={{ minHeight: "500px", backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}
            >
              Waiting for drawer...
            </div>
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Drawer">
            <dl className="detail-list">
              <div>
                <dt>Drawing</dt>
                <dd>{drawer?.name ?? "Unknown"}</dd>
              </div>
              {isDrawer && room.secretWord ? (
                <div>
                  <dt>Your word</dt>
                  <dd>
                    <strong>{room.secretWord}</strong>
                  </dd>
                </div>
              ) : null}
              {!isDrawer && room.wordPlaceholder ? (
                <div>
                  <dt>Word</dt>
                  <dd>
                    <span className="word-placeholder">{room.wordPlaceholder}</span>
                  </dd>
                </div>
              ) : null}
            </dl>
          </Card>

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

          <Card title="Your Guess">
            <GuessForm />
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
