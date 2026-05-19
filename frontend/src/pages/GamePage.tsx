import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const {
    room,
    participantId,
    error,
    isHydrating,
    isLoading,
    isPolling,
    isDrawer,
    isResult,
    canSubmitGuess,
    drawerName,
    guessHistoryRows,
    scoreRows,
    viewerRoundRole,
    visibleSecretWord,
    winnerName
  } = useRoomState();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isHydrating && !room) {
      navigate("/", { replace: true });
    }
  }, [isHydrating, navigate, room]);

  useEffect(() => {
    if (room?.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room?.status]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;

  function resetCanvas() {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#111827";
    context.lineJoin = "round";
    context.lineCap = "round";
    context.lineWidth = 4;
  }

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !isDrawer) {
      return;
    }

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(Math.floor(rect.width), 1);
      canvas.height = Math.max(Math.floor(rect.height), 1);
      resetCanvas();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [isDrawer, room.code]);

  useEffect(() => {
    if (!room || room.status === "lobby") {
      roomStore.stopGamePolling();
      return;
    }

    if (document.visibilityState === "visible") {
      roomStore.startGamePolling();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void roomStore.fetchRoom({
          background: true,
          suppressThrow: true
        });
        roomStore.startGamePolling();
        return;
      }

      roomStore.stopGamePolling();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      roomStore.stopGamePolling();
    };
  }, [room?.code, room?.status, roomStore]);

  function getCanvasPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function handleCanvasPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer) {
      return;
    }

    isDrawingRef.current = true;
    lastPointRef.current = getCanvasPoint(event);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleCanvasPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer || !isDrawingRef.current || !canvasRef.current || !lastPointRef.current) {
      return;
    }

    const context = canvasRef.current.getContext("2d");

    if (!context) {
      return;
    }

    const nextPoint = getCanvasPoint(event);
    context.beginPath();
    context.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    context.lineTo(nextPoint.x, nextPoint.y);
    context.stroke();
    lastPointRef.current = nextPoint;
  }

  function stopDrawing() {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }

  async function handleRefresh() {
    try {
      await roomStore.fetchRoom();
    } catch (_caughtError) {
      // Request errors are already surfaced by the room store state.
    }
  }

  function handleLeave() {
    roomStore.clearSession();
    navigate("/", { replace: true });
  }

  async function handleSubmitGuess(guessText: string) {
    try {
      await roomStore.submitGuess(guessText);
    } catch (_caughtError) {
      // Request errors are already surfaced by the room store state.
    }
  }

  const guessHint =
    room.status === "result"
      ? "Round is over."
      : isDrawer
        ? "Only guessers can submit guesses."
        : "Submit your guess to the room.";

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
          <Scoreboard rows={scoreRows} />
          <ResultPanel historyRows={guessHistoryRows} winnerName={winnerName} isResult={isResult} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            {isDrawer ? (
              <>
                <canvas
                  ref={canvasRef}
                  className="canvas-placeholder"
                  style={{ minHeight: "500px", width: "100%", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", touchAction: "none" }}
                  onPointerDown={handleCanvasPointerDown}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={stopDrawing}
                  onPointerLeave={stopDrawing}
                  onPointerCancel={stopDrawing}
                />
                <div className="button-row button-row--compact" style={{ marginTop: "12px" }}>
                  <button className="button button--secondary" type="button" onClick={resetCanvas}>
                    Clear Canvas
                  </button>
                </div>
              </>
            ) : (
              <div className="canvas-placeholder" style={{ minHeight: "500px", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", display: "grid", placeItems: "center" }}>
                {drawerName ? `${drawerName} is drawing locally in this phase.` : "Waiting for drawer..."}
              </div>
            )}
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Round Info">
            <dl className="detail-list">
              <div>
                <dt>Status</dt>
                <dd>
                  {room.status === "playing" ? "Playing" : room.status === "result" ? "Result" : "Lobby"}
                </dd>
              </div>
              <div>
                <dt>Drawer</dt>
                <dd>{drawerName ?? "Waiting for drawer"}</dd>
              </div>
              <div>
                <dt>Your role</dt>
                <dd>{viewerRoundRole ?? "Waiting for round start"}</dd>
              </div>
              <div>
                <dt>Secret word</dt>
                <dd>{isDrawer ? visibleSecretWord ?? "Loading word..." : "Only the drawer can see the word."}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Lobby role</dt>
                <dd>{viewer?.role ?? "Unknown"}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Your Guess">
            <GuessForm
              disabled={!canSubmitGuess || isLoading}
              error={error}
              hint={guessHint}
              isSubmitting={isLoading}
              onSubmitGuess={handleSubmitGuess}
            />
          </Card>

          <Card title="Refresh">
            <p>
              {error ??
                (isPolling
                  ? "Refreshing shared game state..."
                  : "Shared guesses, scores, and result state update automatically in this phase.")}
            </p>
          </Card>
        </aside>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading || isPolling} onClick={handleRefresh}>
          {isLoading || isPolling ? "Refreshing..." : "Refresh Room"}
        </button>
        <button className="button button--secondary" onClick={handleLeave}>
          Leave Room
        </button>
      </div>
    </section>
  );
}
