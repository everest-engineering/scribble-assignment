import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { CanvasBoard } from "../components/CanvasBoard";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.gameState === "lobby") {
      navigate("/lobby", { replace: true });
      return;
    }

    roomStore.startPolling();
    return () => {
      roomStore.stopPolling();
    };
  }, [navigate, room, roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const currentRound = room.currentRound;
  const isDrawer = currentRound?.drawerId === participantId;

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
          <Card title={room.gameState === "finished" ? "Round Complete" : "Canvas"}>
            {room.gameState === "finished" ? (
              <div className="canvas-placeholder">
                Round complete. Review the results and wait for restart.
              </div>
            ) : isDrawer ? (
              <CanvasBoard />
            ) : (
              <div className="canvas-placeholder">
                Waiting for drawer...
              </div>
            )}
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <div className={isDrawer ? "round-status round-status--drawer" : "round-status round-status--guesser"}>
              <span className="round-status__label">{isDrawer ? "You are drawing" : "You are guessing"}</span>
              <strong className="round-status__value">
                {currentRound?.secretWord ?? currentRound?.drawerName ?? "Waiting for round"}
              </strong>
            </div>
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Drawer</dt>
                <dd>{currentRound?.drawerName ?? "Waiting for drawer"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{isDrawer ? "Drawing" : "Guessing"}</dd>
              </div>
              <div>
                <dt>Secret word</dt>
                <dd className={isDrawer ? "secret-word" : "secret-word secret-word--hidden"}>
                  {currentRound?.secretWord ?? (isDrawer ? "Loading word..." : "Hidden from guessers")}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Guess History">
            {currentRound?.guessHistory?.length ? (
              <ul className="guess-history-list">
                {currentRound.guessHistory.map((guess) => (
                  <li key={guess.id} className="guess-history-item">
                    <strong>{guess.participantName}</strong>: {guess.text}{" "}
                    <span className={guess.correct ? "guess-status guess-status--correct" : "guess-status"}>
                      {guess.correct ? "Correct" : "Incorrect"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No guesses yet.</p>
            )}
          </Card>

          <Card title="Your Guess">
            <GuessForm disabled={room.gameState === "finished"} />
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
