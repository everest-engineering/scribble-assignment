import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { GuessHistory } from "../components/GuessHistory";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomPolling, useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL_MS = 2000;

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room } = useRoomState();

  useRoomPolling(POLL_INTERVAL_MS);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  // A restart returns everyone to the lobby (feature group 4).
  useEffect(() => {
    if (room && room.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room]);

  if (!room) {
    return null;
  }

  const isDrawer = room.viewer?.isDrawer ?? false;
  const isPlaying = room.status === "playing";
  const isResults = room.status === "results";
  const drawer = room.participants.find((participant) => participant.isDrawer) ?? null;

  const headerKicker = isResults ? "Round over" : isDrawer ? "You are drawing" : "You are guessing";
  const headerTitle = isResults
    ? "Results"
    : isDrawer
      ? "Draw the secret word!"
      : "Guess the Word!";

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">{headerKicker}</span>
          <h1 className="game-page__title">{headerTitle}</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            {isDrawer && isPlaying ? (
              <div className="canvas-toolbar">
                <p className="word-banner">
                  Your word: <strong>{room.word ?? "…"}</strong>
                </p>
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => void roomStore.clearCanvas()}
                >
                  Clear Canvas
                </button>
              </div>
            ) : (
              <p className="word-banner">
                Drawer: <strong>{drawer?.name ?? "—"}</strong>
                {isResults ? "" : ". Watch and guess the word!"}
              </p>
            )}
            <DrawingCanvas
              strokes={room.strokes}
              isDrawer={isDrawer && isPlaying}
              onCommit={(strokes) => void roomStore.updateCanvas(strokes)}
            />
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          {isResults ? (
            <ResultPanel room={room} />
          ) : (
            <>
              <Card title="Your Guess">
                <GuessForm disabled={isDrawer} />
              </Card>
              <GuessHistory guesses={room.guesses} />
            </>
          )}
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Back to Lobby
        </button>
      </div>
    </section>
  );
}
