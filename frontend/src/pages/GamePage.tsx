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

  const isDrawer = participantId === room.hostId;
  const drawerParticipant = room.participants.find((p) => p.id === room.hostId) ?? null;
  const secretWord = room.availableWords[0] ?? "";
  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">{isDrawer ? "You are drawing!" : "Guess the Word!"}</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          {isDrawer ? (
            <Card title="Word to Draw">
              <p style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', padding: '16px 0', letterSpacing: '0.05em' }}>
                {secretWord}
              </p>
              <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                Draw this word — don't say it out loud!
              </p>
            </Card>
          ) : (
            <Card title="Canvas">
              <div className="canvas-placeholder" style={{ minHeight: '200px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#6b7280' }}>Waiting for {drawerParticipant?.name ?? "the drawer"} to draw…</p>
              </div>
            </Card>
          )}
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Players">
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>{participant.name}</span>
                  <span className="player-list__meta">
                    {participant.id === room.hostId ? "Drawer" : "Guesser"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Your Role">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd style={{ fontWeight: 600, color: isDrawer ? '#7c3aed' : '#0369a1' }}>
                  {isDrawer ? "Drawer" : "Guesser"}
                </dd>
              </div>
            </dl>
          </Card>

          {!isDrawer && (
            <Card title="Your Guess">
              <GuessForm />
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
