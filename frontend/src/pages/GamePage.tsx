import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { DrawingCanvas } from "../components/DrawingCanvas";
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

  if (room.status === "result") {
    const isHost = room.hostId === participantId;
    const sortedParticipants = [...room.participants].sort((a, b) => b.score - a.score);

    return (
      <section className="panel game-page game-page--result" style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span className="section-kicker" style={{ textTransform: "uppercase", fontSize: "0.875rem", fontWeight: 700, color: "#4f46e5", letterSpacing: "0.05em" }}>
            Round Complete!
          </span>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#111827", marginTop: "8px", marginBottom: "16px" }}>
            Game Results
          </h1>
          <div
            style={{
              display: "inline-block",
              backgroundColor: "#e0e7ff",
              color: "#3730a3",
              border: "1px solid #c7d2fe",
              borderRadius: "12px",
              padding: "12px 24px",
              fontSize: "1.25rem",
              fontWeight: 700,
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}
          >
            The secret word was: <span style={{ textTransform: "uppercase", color: "#4f46e5" }}>{room.secretWord}</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "40px" }}>
          {/* Leaderboard Card */}
          <Card title="Final Standings">
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {sortedParticipants.map((p, idx) => {
                const isWinner = idx === 0 && p.score > 0;
                let rankBadge = `${idx + 1}`;
                let rankColor = "#6b7280";
                let rankBg = "#f3f4f6";
                if (idx === 0) {
                  rankBadge = "🥇";
                  rankColor = "#854d0e";
                  rankBg = "#fef9c3";
                } else if (idx === 1) {
                  rankBadge = "🥈";
                  rankColor = "#374151";
                  rankBg = "#e5e7eb";
                } else if (idx === 2) {
                  rankBadge = "🥉";
                  rankColor = "#78350f";
                  rankBg = "#ffedd5";
                }

                return (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      backgroundColor: isWinner ? "#f5f3ff" : "#ffffff",
                      border: isWinner ? "2px solid #ddd6fe" : "1px solid #e5e7eb",
                      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "32px",
                          height: "32px",
                          borderRadius: "9999px",
                          fontSize: "1rem",
                          fontWeight: 700,
                          backgroundColor: rankBg,
                          color: rankColor
                        }}
                      >
                        {rankBadge}
                      </span>
                      <span style={{ fontWeight: 600, color: "#1f2937" }}>
                        {p.name} {p.id === room.hostId && "👑"} {p.id === participantId && "(You)"}
                      </span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: "1.125rem", color: "#4f46e5" }}>
                      {p.score} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Activity / Guess history Card */}
          <ResultPanel />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            backgroundColor: "#f9fafb",
            borderRadius: "16px",
            border: "1px solid #e5e7eb"
          }}
        >
          <div style={{ flex: 1, paddingRight: "16px" }}>
            {isHost ? (
              <p style={{ color: "#4b5563", fontSize: "0.875rem", margin: 0 }}>
                As the host, you can restart the game and return everyone to the lobby.
              </p>
            ) : (
              <p style={{ color: "#4b5563", fontSize: "0.875rem", margin: 0 }}>
                Waiting for the host to restart the game and return everyone to the lobby...
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              className="button button--secondary"
              style={{ borderColor: "#fee2e2", color: "#b91c1c", backgroundColor: "#fef2f2" }}
              onClick={async () => {
                try {
                  await roomStore.leaveRoom();
                  navigate("/");
                } catch (caughtError) {
                  console.error("Leave room failed:", caughtError);
                }
              }}
            >
              Leave Room
            </button>
            {isHost && (
              <button
                id="restart-button"
                className="button button--primary"
                onClick={async () => {
                  try {
                    await roomStore.restartGame();
                  } catch (caughtError) {
                    console.error("Restart game failed:", caughtError);
                  }
                }}
              >
                Restart Game
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = room.drawerId === participantId;

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
              <DrawingCanvas
                readOnly={false}
                drawingData={room.drawingData || ""}
                onChange={(data) => {
                  if (data === "" || data === "[]") {
                    roomStore.clearDrawing();
                  } else {
                    roomStore.updateDrawing(data);
                  }
                }}
              />
            ) : (
              <DrawingCanvas
                readOnly={true}
                drawingData={room.drawingData || ""}
              />
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
          style={{ borderColor: "#fee2e2", color: "#b91c1c", backgroundColor: "#fef2f2" }}
          onClick={async () => {
            try {
              await roomStore.leaveRoom();
              navigate("/");
            } catch (caughtError) {
              console.error("Leave room failed:", caughtError);
            }
          }}
        >
          Leave Room
        </button>
      </div>
    </section>
  );
}

