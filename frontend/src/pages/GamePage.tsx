import { useCallback, useEffect, useRef, useState } from "react";
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
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [actionError, setActionError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const viewer = room?.participants.find((p) => p.id === participantId) ?? null;
  const isDrawer = participantId !== null && room?.drawerId === participantId;
  const isHost = participantId !== null && room?.hostId === participantId;
  const isFinished = room?.status === "finished";

  const doPoll = useCallback(async () => {
    try {
      await roomStore.fetchRoom();
    } catch {
      // polling error swallowed
    }
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
  }, [room, navigate, doPoll]);

  async function handleStrokeComplete(stroke: { points: { x: number; y: number }[]; color: string; width: number }) {
    try {
      await roomStore.addStroke(stroke);
    } catch {
      // stroke submission error swallowed
    }
  }

  async function handleClearCanvas() {
    try {
      setActionError(null);
      await roomStore.clearDrawing();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Failed to clear canvas");
    }
  }

  async function handleGuessSubmit(text: string) {
    await roomStore.submitGuess(text);
  }

  async function handleEndRound() {
    try {
      setActionError(null);
      await roomStore.endRound();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Failed to end round");
    }
  }

  async function handleRestart() {
    try {
      setActionError(null);
      await roomStore.restartGame();
      navigate("/lobby", { replace: true });
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Failed to restart");
    }
  }

  if (!room) {
    return null;
  }

  if (isFinished) {
    return (
      <section className="panel game-page">
        <div className="game-page__header">
          <div className="game-page__header-left">
            <span className="section-kicker">Round Complete</span>
            <h1 className="game-page__title">Results</h1>
          </div>
          <RoomCodeBadge code={room.code} />
        </div>

        <div className="summary-grid">
          <Card title="The Word Was">
            <p style={{ fontSize: "2rem", fontWeight: 700, textAlign: "center", padding: "24px" }}>
              {room.secretWord ?? "—"}
            </p>
          </Card>

          <Card title="Final Scores">
            <div style={{ display: "grid", gap: "12px" }}>
              {room.participants.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    background: "#f9fafb"
                  }}
                >
                  <span style={{ fontWeight: 500 }}>
                    {p.name}
                    {p.id === room.drawerId ? (
                      <span style={{ marginLeft: "8px", fontSize: "0.75rem", color: "#2563eb", fontWeight: 600 }}>
                        (Drawer)
                      </span>
                    ) : null}
                  </span>
                  <strong style={{ fontSize: "1.125rem" }}>{room.scores[p.id] ?? 0}</strong>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Guess History">
            {room.guesses.length === 0 ? (
              <p>No guesses were submitted this round.</p>
            ) : (
              <div style={{ display: "grid", gap: "8px" }}>
                {room.guesses.map((g, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      border: `1px solid ${g.correct ? '#bbf7d0' : '#e5e7eb'}`,
                      borderRadius: "8px",
                      background: g.correct ? '#f0fdf4' : '#ffffff'
                    }}
                  >
                    <span>
                      {room.participants.find((p) => p.id === g.participantId)?.name ?? "?"}: {g.text}
                    </span>
                    <span style={{ color: g.correct ? '#16a34a' : '#6b7280', fontWeight: 600 }}>
                      {g.correct ? "+100" : "0"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {actionError ? <p className="form__error">{actionError}</p> : null}

        <div className="button-row">
          {isHost ? (
            <button className="button button--primary" onClick={handleRestart}>
              Restart Game
            </button>
          ) : null}
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
          <span className="section-kicker">Round {room.round}</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      {isDrawer && room.secretWord ? (
        <Card title="Your Secret Word">
          <p style={{ fontSize: "1.5rem", fontWeight: 700, textAlign: "center", padding: "16px" }}>
            {room.secretWord}
          </p>
        </Card>
      ) : null}

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard scores={room.scores} participants={room.participants} />
          <ResultPanel guesses={room.guesses} participants={room.participants} />
        </aside>

        <div className="game-page__main">
          <Card title={isDrawer ? "Draw the word" : "Canvas"}>
            <DrawingCanvas
              strokes={room.drawing}
              isDrawer={isDrawer}
              onStrokeComplete={handleStrokeComplete}
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
                <dt>Role</dt>
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
            </dl>
          </Card>

          {!isDrawer ? (
            <Card title="Your Guess">
              <GuessForm onSubmit={handleGuessSubmit} disabled={isFinished} />
            </Card>
          ) : null}
        </aside>
      </div>

      {actionError ? <p className="form__error">{actionError}</p> : null}

      <div className="button-row" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {isDrawer ? (
            <button className="button button--primary" onClick={handleEndRound}>
              End Round
            </button>
          ) : null}
        </div>
        <button className="button button--secondary" onClick={() => navigate("/")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
