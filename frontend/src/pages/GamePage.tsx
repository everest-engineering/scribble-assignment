import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { Canvas } from "../components/Canvas";
import { GuessForm } from "../components/GuessForm";
import { GuessHistory } from "../components/GuessHistory";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { api, type Stroke } from "../services/api";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const redirectOnMount = useRef(true);
  const [canvasStrokes, setCanvasStrokes] = useState<Stroke[]>([]);
  const [canvasError, setCanvasError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
    }

    redirectOnMount.current = false;
  }, [navigate, room]);

  useEffect(() => {
    if (!room) {
      return;
    }

    pollingRef.current = setInterval(() => {
      roomStore.pollRoom();
    }, 2000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      roomStore.clearPolling();
    };
  }, [roomStore, room?.code]);

  useEffect(() => {
    if (!room || room.status !== "playing") {
      return;
    }

    const code = room.code;

    async function pollCanvas() {
      try {
        const result = await api.fetchCanvas(code);
        if (result.canvasState) {
          setCanvasStrokes(result.canvasState.strokes);
        }
        setCanvasError(null);
      } catch {
        setCanvasError("Connection issue...");
      }
    }

    pollCanvas();
    canvasPollingRef.current = setInterval(pollCanvas, 2000);

    return () => {
      if (canvasPollingRef.current) {
        clearInterval(canvasPollingRef.current);
        canvasPollingRef.current = null;
      }
    };
  }, [room?.code, room?.status]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((participant) => participant.role === "drawer") ?? null;
  const isDrawer = viewer?.role === "drawer";
  const isFinished = room.status === "finished";

  const isHost = viewer?.id === room.hostId;
  const guesses = room.guesses ?? [];
  const scores = room.scores ?? {};

  if (isFinished) {
    const roundResult = room.roundResult;
    const winnerName = roundResult?.winnerId
      ? room.participants.find((p) => p.id === roundResult.winnerId)?.name ?? "Unknown"
      : null;

    return (
      <section className="panel placeholder-page">
        <Card title="Round Over">
          <div style={{ marginBottom: "16px" }}>
            <p style={{ fontWeight: 600, marginBottom: "4px" }}>The word was:</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#7c3aed" }}>
              {roundResult?.secretWord ?? "???"}
            </p>
          </div>

          {winnerName ? (
            <p style={{ fontWeight: 600, marginBottom: "12px", color: "#16a34a" }}>
              Winner: {winnerName}
            </p>
          ) : (
            <p style={{ marginBottom: "12px", color: "#6b7280" }}>No one guessed correctly this round.</p>
          )}

          <Scoreboard scores={scores} participants={room.participants} />

          <div style={{ marginTop: "16px" }}>
            <p style={{ fontWeight: 600, marginBottom: "8px" }}>Guess History</p>
            <GuessHistory guesses={guesses} participants={room.participants} />
          </div>
        </Card>

        <div className="button-row">
          {isHost ? (
            <button
              className="button button--primary"
              onClick={async () => {
                try {
                  await roomStore.restartRoom();
                  navigate("/lobby");
                } catch {
                  // stay on page
                }
              }}
            >
              Back to Lobby
            </button>
          ) : null}
          <button className="button button--secondary" onClick={async () => { try { await roomStore.leaveRoom(); navigate("/"); } catch { /* stay */ } }}>
            Leave Game
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
          <Scoreboard scores={scores} participants={room.participants} />
          <ResultPanel guesses={guesses} participants={room.participants} />
        </aside>

        <div className="game-page__main">
          {isDrawer && room.word ? (
            <Card title="Your Word">
              <div className="word-banner">{room.word}</div>
            </Card>
          ) : null}

          <Card title="Canvas">
            <Canvas
              readOnly={!isDrawer}
              strokes={canvasStrokes}
              onStrokeComplete={async (stroke) => {
                try {
                  if (!participantId) return;
                  setCanvasStrokes((prev) => [...prev, stroke]);
                  await api.addStroke(room.code, participantId, stroke);
                } catch {
                  setCanvasError("Connection issue...");
                }
              }}
              onClear={async () => {
                const previousStrokes = canvasStrokes;
                try {
                  if (!participantId) return;
                  setCanvasStrokes([]);
                  await api.clearCanvas(room.code, participantId);
                } catch {
                  setCanvasStrokes(previousStrokes);
                  setCanvasError("Connection issue...");
                }
              }}
            />
            {canvasError ? (
              <p style={{ marginTop: "8px", color: "#b45309", fontSize: "0.875rem" }}>{canvasError}</p>
            ) : null}
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
                <dd>{viewer ? (viewer.role === "drawer" ? "Drawer" : "Guesser") : "Unknown"}</dd>
              </div>
              <div>
                <dt>Drawer</dt>
                <dd>{drawer?.name ?? "Unknown"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  {room.status === "playing"
                    ? "Game in Progress"
                    : "Waiting"}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Your Guess">
            <GuessForm disabled={isDrawer} />
          </Card>
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={async () => { try { await roomStore.leaveRoom(); navigate("/"); } catch { /* stay */ } }}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
