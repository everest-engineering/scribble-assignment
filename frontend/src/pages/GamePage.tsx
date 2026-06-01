import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL = 2000;

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  const doPoll = useCallback(async () => {
    try {
      const updatedRoom = await roomStore.fetchRoom();

      if (updatedRoom) {
        if (updatedRoom.status === "lobby") {
          navigate("/lobby");
        }
      }
    } catch {
      // poll errors are non-fatal
    }
  }, [roomStore, navigate]);

  useEffect(() => {
    pollRef.current = setInterval(doPoll, POLL_INTERVAL);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [doPoll]);

  async function handleRestart() {
    try {
      await roomStore.restartGame();
      navigate("/lobby");
    } catch {
      // error handled by store
    }
  }

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = room.drawerId === participantId;
  const isHost = roomStore.isHost;
  const isResults = room.status === "results";

  if (isResults) {
    return (
      <section className="panel game-page">
        <div className="game-page__header">
          <div className="game-page__header-left">
            <h1 className="game-page__title">Round Complete!</h1>
          </div>
          <RoomCodeBadge code={room.code} />
        </div>

        <div className="game-page__layout">
          <aside className="game-page__sidebar game-page__sidebar--left">
            <Scoreboard />
            <ResultPanel />
          </aside>

          <div className="game-page__main">
            <Card title="The Word Was">
              <div
                style={{
                  padding: "24px",
                  textAlign: "center",
                  background: "#f0fdf4",
                  borderRadius: "8px",
                  border: "1px solid #bbf7d0"
                }}
              >
                <span style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "0.05em" }}>
                  {room.currentWord ?? "???"}
                </span>
              </div>
            </Card>

            <Card title="Final Scores">
              <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
                {room.participants.map((participant) => (
                  <div key={participant.id} className="placeholder-row">
                    <span>{participant.name}</span>
                    <strong>{room.scores[participant.id] ?? 0}</strong>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <aside className="game-page__sidebar game-page__sidebar--right">
            <Card title="Actions">
              {isHost ? (
                <button className="button button--primary" onClick={handleRestart}>
                  Restart Game
                </button>
              ) : (
                <p style={{ color: "#6b7280", fontStyle: "italic" }}>
                  Waiting for the host to restart...
                </p>
              )}
            </Card>
          </aside>
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
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            {isDrawer && room.currentWord ? (
              <div style={{ marginBottom: "16px", padding: "12px 16px", background: "#fef3c7", borderRadius: "8px", border: "1px solid #fde68a" }}>
                <strong>Your word:</strong> <span style={{ fontSize: "1.25rem", fontWeight: 700 }}>{room.currentWord}</span>
              </div>
            ) : null}
            <DrawingCanvas
              isDrawer={isDrawer}
              drawingData={room.drawingData}
              onDraw={(data) => roomStore.updateDrawing(data)}
              onClear={() => roomStore.clearDrawing()}
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
                <dd>Playing</dd>
              </div>
            </dl>
          </Card>

          <Card title="Your Guess">
            <GuessForm disabled={isDrawer || room.status !== "drawing"} />
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
