import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;

  const isDrawer = viewer?.id === room.drawerId;

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
            <div className="canvas-placeholder" style={{ minHeight: '500px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
              Waiting for drawer...
            </div>
          </Card>
          <Card title="Secret Word">
            <p style={{ fontSize: '1.5rem', letterSpacing: '0.2em' }}>{room.word}</p>
            <p style={{ marginTop: '8px' }}>
              {isDrawer ? "You are the drawer. Sketch this word for others to guess." : "Guessers see a placeholder until they win."}
            </p>
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
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
            </dl>
          </Card>

          {!isDrawer ? (
            <Card title="Your Guess">
              <GuessForm />
            </Card>
          ) : null}
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby") }>
          Exit Game
        </button>
      </div>
    </section>
  );
}
