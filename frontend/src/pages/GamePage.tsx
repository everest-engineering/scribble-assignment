import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "../components/Canvas";
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
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doPoll = useCallback(async () => {
    try {
      await roomStore.fetchRoom();
    } catch {
      // polling errors are non-fatal
    }
  }, [roomStore]);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
      return;
    }

    if (!pollingRef.current) {
      pollingRef.current = setInterval(doPoll, 2000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [navigate, room, doPoll]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((p) => p.id === participantId) ?? null;
  const isDrawer = room.drawerId === participantId;
  const isHost = room.hostId === participantId;
  const isFinished = room.status === "finished";
  const isPlaying = room.status === "playing";

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">
            {isFinished ? "Round Over" : isPlaying ? "Round 1" : "Game"}
          </span>
          <h1 className="game-page__title">
            {isDrawer ? "Draw the Word!" : isFinished ? "Results" : "Guess the Word!"}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard
            participants={room.participants}
            scores={room.scores}
            drawerId={room.drawerId}
          />
          <ResultPanel
            guesses={room.guesses}
            secretWord={room.secretWord}
            status={room.status}
            scores={room.scores}
            participants={room.participants}
            viewerParticipantId={participantId}
          />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <Canvas />
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
                <dd>
                  {isDrawer
                    ? "🎨 Drawer"
                    : room.viewerRole === "drawer"
                      ? "🎨 Drawer"
                      : "🔍 Guesser"}
                </dd>
              </div>
              {isDrawer && room.secretWord && isPlaying && (
                <div>
                  <dt>Secret Word</dt>
                  <dd className="secret-word">{room.secretWord}</dd>
                </div>
              )}
            </dl>
          </Card>

          {!isDrawer && isPlaying && (
            <Card title="Your Guess">
              <GuessForm />
            </Card>
          )}
        </aside>
      </div>

      <div className="button-row">
        {isFinished && isHost && (
          <button className="button button--primary" onClick={() => roomStore.restartGame()}>
            Restart Game
          </button>
        )}
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          {isFinished ? "Back to Lobby" : "Exit Game"}
        </button>
      </div>
    </section>
  );
}
