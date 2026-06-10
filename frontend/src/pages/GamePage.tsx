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
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  // Redirect to lobby if status transitions back to lobby (e.g. game restarted)
  useEffect(() => {
    if (room?.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room?.status]);

  // Game polling: keep canvas strokes, scores, and guess history in sync
  useEffect(() => {
    if (!room) return;

    const intervalId = setInterval(async () => {
      try {
        await roomStore.fetchRoom();
      } catch (caughtError) {
        console.error("Game polling error:", caughtError);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [room, roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((p) => p.id === participantId) ?? null;
  const isDrawer = participantId != null && participantId === room.currentDrawerId;
  const drawerParticipant = room.participants.find((p) => p.id === room.currentDrawerId);

  function renderWordDisplay() {
    if (isDrawer && room?.secretWord) {
      return (
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <p style={{ fontSize: "0.85em", color: "#6b7280", marginBottom: "4px" }}>
            Your secret word:
          </p>
          <p
            style={{
              fontSize: "1.75em",
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "#3730a3"
            }}
          >
            {room.secretWord}
          </p>
        </div>
      );
    }

    return (
      <div style={{ textAlign: "center", padding: "12px 0" }}>
        <p style={{ fontSize: "0.85em", color: "#6b7280", marginBottom: "4px" }}>
          {drawerParticipant
            ? `${drawerParticipant.name} is drawing…`
            : "Waiting for drawer…"}
        </p>
        <p style={{ fontSize: "1.75em", letterSpacing: "0.25em", color: "#374151" }}>
          {room?.secretWord ?? "_ _ _ _ _"}
        </p>
      </div>
    );
  }

  const isHost = viewer?.isHost === true;

  if (room.status === "results") {
    return (
      <section className="panel game-page">
        <div className="game-page__header">
          <div className="game-page__header-left">
            <span className="section-kicker">Round Over</span>
            <h1 className="game-page__title">Game Results</h1>
          </div>
          <RoomCodeBadge code={room.code} />
        </div>

        <div style={{ textAlign: "center", padding: "24px 0", backgroundColor: "#f3f4f6", borderRadius: "8px", marginBottom: "24px" }}>
          <p style={{ fontSize: "0.9em", color: "#4b5563", marginBottom: "8px", fontWeight: 500 }}>
            The secret word was:
          </p>
          <p
            id="reveal-word"
            style={{
              fontSize: "2.5em",
              fontWeight: 800,
              letterSpacing: "0.05em",
              color: "#3730a3",
              margin: 0
            }}
          >
            {room.secretWord}
          </p>
        </div>

        <div className="game-page__layout">
          <aside className="game-page__sidebar game-page__sidebar--left">
            <Scoreboard />
          </aside>

          <div className="game-page__main">
            <ResultPanel />
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
                  <dd>{isHost ? "👑 Host" : "Player"}</dd>
                </div>
                <div>
                  <dt>Final Score</dt>
                  <dd style={{ fontWeight: 700, color: (viewer?.score ?? 0) > 0 ? "#16a34a" : undefined }}>
                    {viewer?.score ?? 0} pts
                  </dd>
                </div>
              </dl>
            </Card>
          </aside>
        </div>

        <div className="button-row button-row--spread" style={{ marginTop: "24px" }}>
          <button className="button button--secondary" onClick={() => navigate("/lobby")}>
            Exit Game
          </button>
          {isHost && (
            <button
              id="restart-game-btn"
              className="button button--primary"
              onClick={async () => {
                try {
                  await roomStore.restartGame();
                } catch (err) {
                  console.error("Failed to restart:", err);
                }
              }}
            >
              Restart Game
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">
            {isDrawer ? "You are drawing!" : "Guess the Word!"}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          {renderWordDisplay()}
          <Card title="Canvas">
            <DrawingCanvas isDrawer={isDrawer} />
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
                <dd>{isDrawer ? "🎨 Drawer" : "🔍 Guesser"}</dd>
              </div>
              <div>
                <dt>Score</dt>
                <dd style={{ fontWeight: 700, color: (viewer?.score ?? 0) > 0 ? "#16a34a" : undefined }}>
                  {viewer?.score ?? 0} pts
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
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
