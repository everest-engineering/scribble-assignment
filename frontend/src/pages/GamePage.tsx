import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";
import type { Point } from "../services/api";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  const poll = useCallback(async () => {
    if (!room) return;
    try {
      const updatedRoom = await roomStore.fetchRoom();
      if (updatedRoom && updatedRoom.status === "lobby") {
        navigate("/lobby", { replace: true });
      }
    } catch {
      // polling errors are non-fatal
    }
  }, [roomStore, navigate, room]);

  useEffect(() => {
    if (!room) return;
    const interval = setInterval(() => { void poll(); }, 2000);
    return () => clearInterval(interval);
  }, [poll, room]);

  async function handleGuessSubmit(guess: string) {
    await roomStore.submitGuess(guess);
  }

  async function handleStroke(points: Point[]) {
    await roomStore.draw([{ type: "stroke", points }]);
  }

  async function handleClearCanvas() {
    await roomStore.draw([{ type: "clear" }]);
  }

  async function handleRestart() {
    if (!roomStore.isHost()) return;
    const updatedRoom = await roomStore.restartGame();
    if (updatedRoom) {
      navigate("/lobby", { replace: true });
    }
  }

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((p) => p.id === participantId) ?? null;
  const isDrawer = participantId === room.drawerId;
  const isHost = roomStore.isHost();
  const isFinished = room.status === "finished";

  if (isFinished) {
    return (
      <section className="panel game-page">
        <div className="game-page__header">
          <div className="game-page__header-left">
            <span className="section-kicker">Game Over</span>
            <h1 className="game-page__title">Round Complete!</h1>
          </div>
          <RoomCodeBadge code={room.code} />
        </div>

        <div className="summary-grid">
          <Card title="The Word Was">
            <p style={{ fontSize: "2rem", fontWeight: 700, textAlign: "center" }}>
              {room.secretWord ?? "Unknown"}
            </p>
          </Card>

          <Card title="Final Scores">
            <ul className="player-list">
              {room.participants.map((p) => (
                <li key={p.id}>
                  <span>{p.name}</span>
                  <strong>{room.scores[p.id] ?? 0} pts</strong>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="single-column-grid">
          <Card title="Guess History">
            {room.guesses.length === 0 ? (
              <p>No guesses were submitted.</p>
            ) : (
              <ul className="player-list">
                {room.guesses.map((g, i) => (
                  <li key={i}>
                    <span>{g.playerName}: {g.text}</span>
                    <span style={{ color: g.isCorrect ? "#059669" : "#dc2626", fontWeight: 600 }}>
                      {g.isCorrect ? "Correct!" : "Incorrect"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="button-row button-row--spread">
          {isHost ? (
            <button className="button button--primary" onClick={() => { void handleRestart(); }}>
              Restart Game
            </button>
          ) : (
            <p style={{ color: "#6b7280" }}>Waiting for host to restart...</p>
          )}
          <button className="button button--secondary" onClick={() => navigate("/")}>
            Exit to Home
          </button>
        </div>
      </section>
    );
  }

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
          <Scoreboard scores={room.scores} participants={room.participants} />
          <ResultPanel guesses={room.guesses} />
        </aside>

        <div className="game-page__main">
          <Card title={isDrawer ? "Your Canvas" : "Canvas"}>
            {isDrawer ? (
              <div style={{ marginBottom: "12px", padding: "12px", backgroundColor: "#fef3c7", borderRadius: "8px", textAlign: "center" }}>
                <strong>Your word: {room.secretWord}</strong>
              </div>
            ) : null}
            <DrawingCanvas
              drawCommands={room.drawCommands}
              isDrawer={isDrawer}
              onStroke={handleStroke}
              onClear={handleClearCanvas}
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
                <dt>Status</dt>
                <dd>{isDrawer ? "Drawing" : "Guessing"}</dd>
              </div>
              <div>
                <dt>Score</dt>
                <dd>{room.scores[participantId ?? ""] ?? 0} pts</dd>
              </div>
            </dl>
          </Card>

          {isDrawer ? (
            <Card title="Your Word">
              <p style={{ fontSize: "1.25rem", fontWeight: 600, textAlign: "center" }}>
                {room.secretWord ?? "Loading..."}
              </p>
            </Card>
          ) : (
            <Card title="Your Guess">
              <GuessForm disabled={isDrawer} onSubmit={handleGuessSubmit} />
            </Card>
          )}
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
