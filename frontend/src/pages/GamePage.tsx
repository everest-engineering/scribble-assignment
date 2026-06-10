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

  // Keep game state fresh via polling (T014)
  useEffect(() => {
    roomStore.startPolling(2000);
    return () => roomStore.stopPolling();
  }, [roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((p) => p.id === participantId) ?? null;
  const isDrawer = participantId !== null && participantId === room.drawerId;
  const role = isDrawer ? "Drawer" : "Guesser";

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
          {/* Secret word — shown to drawer only (T012) */}
          {isDrawer && room.secretWord && (
            <Card title="Your Word">
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  textAlign: "center",
                  padding: "1rem",
                  letterSpacing: "0.05em"
                }}
              >
                {room.secretWord}
              </p>
            </Card>
          )}

          <Card title="Canvas">
            {isDrawer ? (
              <DrawingCanvas />
            ) : (
              <div
                className="canvas-placeholder"
                style={{ minHeight: "450px", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}
              >
                Waiting for drawer...
              </div>
            )}
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
                {/* Role badge — text-based for WCAG 2.1 AA (T011, T016) */}
                <dd>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      backgroundColor: isDrawer ? "#dbeafe" : "#dcfce7",
                      color: isDrawer ? "#1d4ed8" : "#15803d",
                      fontWeight: 600,
                      fontSize: "0.875rem"
                    }}
                  >
                    {role}
                  </span>
                </dd>
              </div>
            </dl>
          </Card>

          {/* Participant list with "Drawing" label (T013) */}
          <Card title="Players">
            <ul className="player-list">
              {room.participants.map((p) => (
                <li key={p.id}>
                  <span>{p.name}</span>
                  {p.id === room.drawerId ? (
                    <span className="player-list__meta">Drawing</span>
                  ) : (
                    <span className="player-list__meta">Guessing</span>
                  )}
                </li>
              ))}
            </ul>
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
