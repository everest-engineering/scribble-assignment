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
  const store = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    const id = setInterval(() => {
      store.fetchRoom();
    }, 2000);
    return () => clearInterval(id);
  }, [store]);

  useEffect(() => {
    if (room?.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [room?.status, navigate]);

  if (!room) {
    return null;
  }

  const isDrawer = participantId === room.hostId;
  const drawerParticipant = room.participants.find((p) => p.id === room.hostId) ?? null;
  const secretWord = room.availableWords[0] ?? "";
  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;

  if (room.status === "ended") {
    const sortedScores = [...room.scores].sort((a, b) => b.score - a.score);
    return (
      <section className="panel game-page">
        <div className="game-page__header">
          <div className="game-page__header-left">
            <span className="section-kicker">Round Over</span>
            <h1 className="game-page__title">The word was: <strong>{secretWord}</strong></h1>
          </div>
          <RoomCodeBadge code={room.code} />
        </div>

        <div className="game-page__layout">
          <aside className="game-page__sidebar game-page__sidebar--left">
            <Card title="Final Scores">
              <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
                {sortedScores.map(({ participantId: pid, score }) => {
                  const name = room.participants.find((p) => p.id === pid)?.name ?? "Unknown";
                  return (
                    <div key={pid} className="placeholder-row">
                      <span>{name}</span>
                      <strong>{score}</strong>
                    </div>
                  );
                })}
              </div>
            </Card>
          </aside>

          <div className="game-page__main">
            <Card title="Guess History">
              <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
                {room.guesses.length === 0 ? (
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No guesses submitted.</p>
                ) : (
                  room.guesses.map((guess) => {
                    const name = room.participants.find((p) => p.id === guess.guesserId)?.name ?? "Unknown player";
                    return (
                      <div key={guess.id} className="placeholder-row">
                        <span><strong>{name}</strong>: {guess.text}</span>
                        <span style={{ color: guess.isCorrect ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                          {guess.isCorrect ? '✓' : '✗'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          <aside className="game-page__sidebar game-page__sidebar--right">
            <Card title="Next Round">
              {isDrawer ? (
                <div>
                  <button
                    className="button button--primary"
                    style={{ width: '100%' }}
                    onClick={() => store.restartRoom()}
                  >
                    Play Again
                  </button>
                </div>
              ) : (
                <p style={{ color: '#6b7280', fontSize: '0.875rem', textAlign: 'center' }}>
                  Waiting for host to start a new round…
                </p>
              )}
            </Card>
          </aside>
        </div>
      </section>
    );
  }

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
            <Card title={`Draw: ${secretWord}`}>
              <DrawingCanvas />
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
        {isDrawer && room.status === "active" && (
          <button className="button button--primary" onClick={() => store.endRound()}>
            End Round
          </button>
        )}
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
