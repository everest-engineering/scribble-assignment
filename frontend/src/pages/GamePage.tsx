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
  const isCurrentDrawer = viewer?.id === room.currentDrawer;

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
              {isCurrentDrawer ? (
                <div>
                  <p>You are drawing!</p>
                  <p className="secret-word">Secret word: <strong>{room.secretWord ?? "UNKNOWN"}</strong></p>
                </div>
              ) : (
                <p>Waiting for the drawer to draw the secret word.</p>
              )}
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
                <dd>{isCurrentDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Scores">
            <ul>
              {Object.entries(room.scores ?? {}).map(([id, score]) => {
                const p = room.participants.find((pr) => pr.id === id);
                return (
                  <li key={id}>
                    {p?.name ?? id}: {String(score)}
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card title="Recent Guesses">
            <ul className="guess-list">
              {((room.guesses ?? []) as { participantId: string; text: string; timestamp: string; correct: boolean }[])
                .slice()
                .reverse()
                .map((g, idx) => {
                  const p = room.participants.find((pr) => pr.id === g.participantId);
                  return (
                    <li key={`${g.participantId}-${idx}`}>
                      <strong>{p?.name ?? g.participantId}</strong>: {g.text} {g.correct ? "(correct)" : ""}
                    </li>
                  );
                })}
            </ul>
          </Card>

          <Card title="Your Guess">
            <GuessForm disabled={isCurrentDrawer} />
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
