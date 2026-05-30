import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";
export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, error, isLoading, participantId } = useRoomState();
  const [searchParams] = useSearchParams();
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const code = searchParams.get("code");
    const pid = searchParams.get("participantId");

    if (!room) {
      if (code && pid) {
        roomStore
          .initializeFromUrl(code, pid)
          .then(() => setIsRestoring(false))
          .catch(() => {
            setIsRestoring(false);
            navigate("/", { replace: true });
          });
      } else {
        setIsRestoring(false);
        navigate("/", { replace: true });
      }
    } else {
      setIsRestoring(false);
    }
  }, [room, searchParams, roomStore, navigate]);

  // Game Page Polling (every 2 seconds)
  useEffect(() => {
    if (!room) return;

    const interval = setInterval(() => {
      roomStore.fetchRoom().catch((caughtError) => {
        console.error("Game polling error:", caughtError);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [room, roomStore]);

  // Redirection when room status transitions back to lobby
  useEffect(() => {
    if (room?.status === "lobby" && participantId) {
      navigate(`/lobby?code=${room.code}&participantId=${participantId}`);
    }
  }, [room?.status, room?.code, participantId, navigate]);

  if (isRestoring || (isLoading && !room)) {
    return (
      <section className="panel placeholder-page">
        <p>Loading session...</p>
      </section>
    );
  }

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = room.drawerId === participantId;
  const drawerParticipant = room.participants.find((p) => p.id === room.drawerId);
  const drawerName = drawerParticipant ? drawerParticipant.name : "the drawer";

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          {isDrawer ? (
            <h1 className="game-page__title" style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span>You are drawing!</span>
              <span
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  backgroundColor: "#ecfdf5",
                  color: "#047857",
                  border: "1px solid #a7f3d0",
                  padding: "4px 12px",
                  borderRadius: "8px",
                  textTransform: "uppercase"
                }}
              >
                Secret Word: {room.secretWord}
              </span>
            </h1>
          ) : (
            <h1 className="game-page__title">Guess the Word!</h1>
          )}
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            {isDrawer ? (
              <div
                className="canvas-placeholder"
                style={{
                  minHeight: '500px',
                  backgroundColor: '#ffffff',
                  border: '2px dashed #f59e0b',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}
              >
                <span style={{ fontSize: "1.5rem", fontWeight: "600", color: "#d97706" }}>✏️ Active Canvas</span>
                <p style={{ color: "#78350f" }}>Start drawing your word: <strong>{room.secretWord}</strong></p>
              </div>
            ) : (
              <div
                className="canvas-placeholder"
                style={{
                  minHeight: '500px',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}
              >
                <span style={{ fontSize: "1.5rem", fontWeight: "600", color: "#6b7280" }}>👁️ Read-Only Canvas</span>
                <p style={{ color: "#9ca3af" }}>Waiting for {drawerName} to draw...</p>
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
                <dt>Status</dt>
                <dd>{isDrawer ? "Drawing" : "Guessing"}</dd>
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
        <button
          className="button button--secondary"
          onClick={() => navigate(`/lobby?code=${room.code}&participantId=${participantId}`)}
        >
          Exit Game
        </button>
      </div>
    </section>
  );
}

