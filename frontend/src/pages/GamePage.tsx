import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { usePolling, useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const prevStatusRef = useRef(room?.status);

  usePolling(true);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (room && room.status === "lobby" && prevStatusRef.current !== "lobby") {
      navigate("/lobby", { replace: true });
    }
    prevStatusRef.current = room?.status;
  }, [navigate, room]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((p) => p.id === participantId) ?? null;
  const isDrawer = participantId === room.drawerId;
  const isHost = participantId === room.hostId;
  const isResult = room.status === "result";
  const isPlaying = room.status === "playing";

  async function handleRestart() {
    try {
      await roomStore.restartGame();
    } catch {
    }
  }

  async function handleEndRound() {
    try {
      await roomStore.endRound();
    } catch {
    }
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">
            {isResult ? "Round Over!" : "Guess the Word!"}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} />
          {isResult ? (
            <ResultPanel guesses={room.guesses} secretWord={room.secretWord} />
          ) : null}
        </aside>

        <div className="game-page__main">
          <Card title={`Drawer: ${room.participants.find((p) => p.id === room.drawerId)?.name ?? "Unknown"}`}>
            {isPlaying ? (
              <>
                {isDrawer ? (
                  <div className="secret-word-banner">
                    Your word: <strong>{room.secretWord}</strong>
                  </div>
                ) : (
                  <div className="secret-word-banner secret-word-banner--hidden">
                    Waiting for the drawer to draw...
                  </div>
                )}
                <DrawingCanvas />
              </>
            ) : null}

            {isResult ? (
              <div className="canvas-placeholder" style={{ minHeight: '300px', display: 'grid', placeItems: 'center' }}>
                {room.drawingData ? (
                  <img src={room.drawingData} alt="Final drawing" style={{ maxWidth: '100%', maxHeight: '400px' }} />
                ) : (
                  <p>No drawing was made.</p>
                )}
              </div>
            ) : null}
          </Card>

          {isPlaying ? (
            <Card title="Guess History">
              {room.guesses.length === 0 ? (
                <p>No guesses yet.</p>
              ) : (
                <ul className="guess-list">
                  {room.guesses.map((guess, index) => (
                    <li key={index} className={guess.isCorrect ? "guess-list__item--correct" : ""}>
                      <span className="guess-list__author">{guess.participantName}:</span>
                      <span className="guess-list__text">{guess.text}</span>
                      {guess.isCorrect ? <span className="guess-list__correct">Correct!</span> : null}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ) : null}
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
              {isDrawer && isPlaying ? (
                <div>
                  <dt>Secret Word</dt>
                  <dd className="secret-word">{room.secretWord}</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          {isPlaying && !isDrawer ? (
            <Card title="Your Guess">
              <GuessForm />
            </Card>
          ) : null}

          {isResult ? (
            <Card title="Actions">
              {isHost ? (
                <button className="button button--primary" onClick={handleRestart}>
                  Restart Game
                </button>
              ) : (
                <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Waiting for host to restart...</p>
              )}
            </Card>
          ) : null}
        </aside>
      </div>

      {isPlaying && isDrawer ? (
        <div className="button-row button-row--spread">
          <button className="button button--secondary" onClick={handleEndRound}>
            End Round
          </button>
        </div>
      ) : null}
    </section>
  );
}
