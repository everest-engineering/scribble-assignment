import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "../components/Canvas";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomPolling } from "../hooks/useRoomPolling";
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

    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room]);

  useRoomPolling(() => {
    void roomStore.fetchRoomPoll();
  }, Boolean(room && (room.status === "playing" || room.status === "result")));

  if (!room || !participantId) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = room.viewer?.isDrawer ?? false;
  const secretWord = room.currentRound?.secretWord ?? null;
  const strokes = room.currentRound?.strokes ?? [];
  const guesses = room.currentRound?.guesses ?? [];
  const scores = room.currentRound?.scores ?? [];
  const canGuess = room.status === "playing" && !isDrawer;
  const canDraw = room.status === "playing" && isDrawer;
  const roundLabel =
    room.currentRound !== undefined ? `Round ${room.currentRound.roundIndex + 1}` : "Round 1";
  const statusLabel =
    room.status === "result" ? "Result" : room.status === "playing" ? "Playing" : room.status;

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">{roundLabel}</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          {isDrawer && secretWord ? (
            <Card title="Your Word">
              <p className="word-card" style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
                {secretWord}
              </p>
              <p style={{ marginTop: "8px", color: "#6b7280" }}>Draw this word for others to guess.</p>
            </Card>
          ) : (
            <Card title="What's being drawn?">
              <p style={{ margin: 0 }}>Watch the canvas and submit your guess when ready.</p>
            </Card>
          )}
          <Scoreboard scores={scores} />
          <ResultPanel guesses={guesses} status={room.status} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <Canvas
              strokes={strokes}
              isDrawer={isDrawer}
              disabled={!canDraw}
              onStrokeComplete={(points) => {
                void roomStore.appendStroke({ points, color: "#000000", width: 2 });
              }}
              onClear={() => {
                void roomStore.clearStrokes();
              }}
            />
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
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{statusLabel}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Your Guess">
            {isDrawer ? (
              <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
                Only guessers can submit guesses.
              </p>
            ) : (
              <GuessForm disabled={!canGuess} />
            )}
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
