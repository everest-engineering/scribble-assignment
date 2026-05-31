import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    } else if (room.status === "lobby") {
      navigate("/lobby");
    }
  }, [navigate, room]);

  const handleRefresh = useCallback(async () => {
    await roomStore.fetchRoom();
  }, [roomStore]);

  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 2000);

    return () => clearInterval(interval);
  }, [handleRefresh]);

  async function handleEndRound() {
    try {
      setActionError(null);
      await roomStore.endRound();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to end round");
    }
  }

  async function handleRestart() {
    try {
      setActionError(null);
      const updatedRoom = await roomStore.restartGame();
      if (updatedRoom) {
        navigate("/lobby");
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to restart");
    }
  }

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = viewer?.role === "drawer";
  const isHost = participantId === room.hostId;
  const isResults = room.status === "results";

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">
            {isResults ? "Round Over" : `Round ${room.currentRound}`}
          </span>
          <h1 className="game-page__title">
            {isResults ? "Results" : isDrawer ? "Draw the Word!" : "Guess the Word!"}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} />
          <Card title="Guess History">
            {room.guesses.length === 0 ? (
              <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
                <div className="placeholder-row">
                  <span>No guesses yet</span>
                </div>
              </div>
            ) : (
              <ul className="guess-history-list">
                {room.guesses.map((g, index) => (
                  <li key={index} className={`guess-history-row ${g.correct ? "guess-history-row--correct" : ""}`}>
                    <span className="guess-history-name">{g.participantName}</span>
                    <span className="guess-history-text">{g.text}</span>
                    <span className={`guess-history-badge ${g.correct ? "guess-history-badge--correct" : "guess-history-badge--incorrect"}`}>
                      {g.correct ? "Correct" : "Incorrect"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>

        <div className="game-page__main">
          <Card title={isResults ? "The Word Was" : "Secret Word"}>
            {room.currentWord ? (
              <p className="secret-word">{room.currentWord}</p>
            ) : (
              <p className="secret-word secret-word--hidden">
                {"_ ".repeat(room.currentWordLength).trim()}
              </p>
            )}
          </Card>
          {!isResults ? (
            <Card title="Canvas">
              {isDrawer ? (
                <DrawingCanvas />
              ) : (
                <div className="canvas-placeholder">
                  Waiting for drawer to draw...
                </div>
              )}
            </Card>
          ) : null}
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>
                  {viewer?.name ?? "Unknown player"}
                  {isDrawer ? <span className="player-list__meta player-list__drawer"> drawer</span> : null}
                </dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
            </dl>
          </Card>

          {!isDrawer && !isResults ? (
            <Card title="Your Guess">
              <GuessForm />
            </Card>
          ) : null}
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/")}>
          Exit Game
        </button>
        {isHost && isResults ? (
          <button className="button button--primary" onClick={handleRestart}>
            Restart Game
          </button>
        ) : null}
        {isHost && !isResults && room.status === "playing" ? (
          <button className="button button--accent" onClick={handleEndRound}>
            End Round
          </button>
        ) : null}
        {actionError ? <p className="form__error">{actionError}</p> : null}
      </div>
    </section>
  );
}
