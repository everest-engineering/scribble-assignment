import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/Canvas";
import { GuessForm } from "../components/GuessForm";
import { GuessHistory } from "../components/GuessHistory";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doPoll = useCallback(() => {
    roomStore.fetchRoom().catch((caughtError) => {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh game");
    });
  }, [roomStore]);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    pollingRef.current = setInterval(doPoll, 2000);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [navigate, room, doPoll]);

  useEffect(() => {
    if (room && room.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((participant) => participant.id === room.drawerId) ?? null;
  const isDrawer = participantId === room.drawerId;
  const isHost = room.hostId === participantId;
  const isResult = room.status === "result";

  async function handleGuess(text: string) {
    await roomStore.submitGuess(text);
    doPoll();
  }

  async function handleRestart() {
    try {
      await roomStore.restartGame();
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to restart game");
    }
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">
            {isResult ? "Round Complete" : `Round ${room.round}`}
          </span>
          <h1 className="game-page__title">
            {isResult ? "Round Over!" : isDrawer ? "Draw the Word!" : "Guess the Word!"}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      {refreshError ? <p className="form__error">{refreshError}</p> : null}

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} scores={room.scores} drawerId={room.drawerId} />
          <GuessHistory guesses={room.guesses} />
        </aside>

        <div className="game-page__main">
          {isResult ? (
            <Card title="The Word Was">
              <div className="correct-word-display">
                <span className="correct-word">{room.correctWord}</span>
              </div>
            </Card>
          ) : (
            <>
              {isDrawer && room.secretWord ? (
                <Card title="Your Secret Word">
                  <div className="secret-word-display">
                    <span className="secret-word">{room.secretWord}</span>
                  </div>
                </Card>
              ) : null}
              <Card title="Canvas">
                {isDrawer ? (
                  <DrawingCanvas />
                ) : (
                  <div className="canvas-placeholder" style={{ minHeight: "500px", backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                    Waiting for {drawer?.name ?? "the drawer"} to draw...
                  </div>
                )}
              </Card>
            </>
          )}
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
                <dd>{isResult ? "Spectator" : isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
              {!isDrawer && drawer ? (
                <div>
                  <dt>Drawer</dt>
                  <dd>{drawer.name}</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          {isResult ? (
            isHost ? (
              <Card title="Actions">
                <div className="button-row">
                  <button className="button button--primary" onClick={handleRestart}>
                    Restart Game
                  </button>
                </div>
              </Card>
            ) : (
              <Card title="Actions">
                <p className="waiting-message">Waiting for the host to restart the game...</p>
              </Card>
            )
          ) : !isDrawer ? (
            <Card title="Your Guess">
              <GuessForm onSubmit={handleGuess} />
            </Card>
          ) : null}
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
