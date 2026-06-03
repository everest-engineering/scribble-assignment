import { useEffect, useRef } from "react";
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
  const sessionRestoreAttempted = useRef(false);

  useEffect(() => {
    if (room) return;

    if (sessionRestoreAttempted.current) {
      navigate("/", { replace: true });
      return;
    }

    sessionRestoreAttempted.current = true;
    roomStore
      .restoreSession()
      .then((restored) => {
        if (!restored) navigate("/", { replace: true });
      })
      .catch(() => navigate("/", { replace: true }));
  }, [room, navigate, roomStore]);

  useEffect(() => {
    if (room && room.status !== "active") {
      navigate("/", { replace: true });
    }
  }, [room, navigate]);

  if (!room) {
    return null;
  }

  const isDrawer = participantId !== null && room.drawerId === participantId;
  const drawerParticipant = room.participants.find((p) => p.id === room.drawerId);
  const viewer = room.participants.find((p) => p.id === participantId) ?? null;

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
          <Card title="Current Round">
            <dl className="detail-list">
              <div>
                <dt>Drawer</dt>
                <dd>{drawerParticipant?.name ?? "Unknown"} {isDrawer ? "(you)" : ""}</dd>
              </div>
              <div>
                <dt>{isDrawer ? "Your word" : "Word"}</dt>
                <dd>
                  {isDrawer && room.currentWord
                    ? <strong>{room.currentWord}</strong>
                    : "A word has been chosen — start guessing!"}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Canvas">
            <div className="canvas-placeholder" style={{ minHeight: "500px", backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
              {isDrawer ? "You are drawing!" : "Waiting for drawer..."}
            </div>
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
