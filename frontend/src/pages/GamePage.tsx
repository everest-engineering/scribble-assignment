import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "../components/Canvas";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, viewerIsHost: stateViewerIsHost } = useRoomState();
  const [isRestoring, setIsRestoring] = useState(true);
  const canvasTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStrokesRef = useRef<boolean>(false);

  useEffect(() => {
    let mounted = true;

    async function restore() {
      if (room) {
        setIsRestoring(false);
        return;
      }

      await roomStore.restoreRoomSession();

      if (mounted) {
        setIsRestoring(false);
      }
    }

    restore();

    return () => {
      mounted = false;
    };
  }, [roomStore, room]);

  useEffect(() => {
    if (!room && !isRestoring) {
      navigate("/", { replace: true });
    }
  }, [navigate, room, isRestoring]);

  // Redirect to lobby if room is back in lobby state
  useEffect(() => {
    if (room && room.status === "lobby" && !isRestoring) {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room, isRestoring]);

  // Poll for room updates every 2 seconds
  useEffect(() => {
    if (isRestoring) return;

    let mounted = true;

    async function poll() {
      if (!mounted) return;
      try {
        await roomStore.fetchRoom();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("Room not found")) {
          roomStore.clearStoredParticipantForRoom(room?.code);
          navigate("/", { replace: true });
        }
      }
    }

    const id = setInterval(poll, 2000);
    poll();

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [roomStore, navigate, isRestoring]);

  // Determine viewer role
  const isDrawer =
    !!room &&
    !!participantId &&
    room.currentRound?.drawerParticipantId === participantId;

  const isGuesser =
    !!room &&
    !!participantId &&
    room.currentRound !== undefined &&
    room.currentRound.drawerParticipantId !== participantId;

  const hasGuessedCorrectly =
    isGuesser &&
    room!.currentRound!.guesses.some(
      (g) => g.participantId === participantId && g.isCorrect,
    );

  const viewer =
    room?.participants.find((p) => p.id === participantId) ?? null;

  const viewerIsHost =
    !!room && (stateViewerIsHost || room.viewerIsHost || room.hostParticipantId === participantId);

  // Canvas stroke handling with debounce
  const handleStrokesChange = useCallback(
    (strokes: Parameters<typeof Canvas>[0]["strokes"]) => {
      pendingStrokesRef.current = true;

      if (canvasTimerRef.current) {
        clearTimeout(canvasTimerRef.current);
      }

      canvasTimerRef.current = setTimeout(() => {
        pendingStrokesRef.current = false;
        roomStore.updateCanvas(strokes);
      }, 500);
    },
    [roomStore],
  );

  // Clear canvas
  const handleClearCanvas = useCallback(() => {
    if (canvasTimerRef.current) {
      clearTimeout(canvasTimerRef.current);
    }
    roomStore.updateCanvas([]);
  }, [roomStore]);

  // Guess submission
  const handleGuessSubmit = useCallback(
    async (text: string) => {
      await roomStore.submitGuess(text);
    },
    [roomStore],
  );

  // Restart game
  const handleRestart = useCallback(async () => {
    try {
      await roomStore.restartGame();
      navigate("/lobby");
    } catch {
      roomStore.setError("Failed to restart game");
    }
  }, [roomStore, navigate]);

  // Cleanup canvas timer on unmount
  useEffect(() => {
    return () => {
      if (canvasTimerRef.current) {
        clearTimeout(canvasTimerRef.current);
      }
    };
  }, []);

  if (!room || isRestoring) {
    return null;
  }

  // Result state
  if (room.status === "result") {
    return (
      <section className="panel game-page">
        <div className="game-page__header">
          <div className="game-page__header-left">
            <span className="section-kicker">Round Complete</span>
            <h1 className="game-page__title">Round Over!</h1>
          </div>
          <RoomCodeBadge code={room.code} />
        </div>

        <div className="game-page__layout">
          <aside className="game-page__sidebar game-page__sidebar--left">
            <Scoreboard
              participants={room.participants}
              scores={room.currentRound?.scores}
              drawerParticipantId={room.currentRound?.drawerParticipantId}
            />
          </aside>

          <div className="game-page__main">
            <Card title="Result">
              <ResultPanel
                guesses={room.currentRound?.guesses ?? []}
                participants={room.participants}
                revealed={true}
                secretWord={room.currentRound?.secretWord}
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
                  <dd>Round Complete</dd>
                </div>
              </dl>
            </Card>

            {viewerIsHost ? (
              <div className="button-row button-row--compact">
                <button
                  className="button button--primary"
                  onClick={handleRestart}
                >
                  Restart Game
                </button>
              </div>
            ) : (
              <Card title="Waiting">
                <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  Waiting for the host to restart...
                </p>
              </Card>
            )}

            <div className="button-row button-row--compact">
              <button
                className="button button--secondary"
                onClick={() => navigate("/lobby")}
              >
                Exit Game
              </button>
            </div>
          </aside>
        </div>
      </section>
    );
  }

  // Playing state
  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {room.currentRound?.roundNumber ?? 1}</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard
            participants={room.participants}
            scores={room.currentRound?.scores}
            drawerParticipantId={room.currentRound?.drawerParticipantId}
          />
          <ResultPanel
            guesses={room.currentRound?.guesses ?? []}
            participants={room.participants}
          />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            {isDrawer && room.currentRound?.secretWord ? (
              <div style={{ marginBottom: "12px" }}>
                <p style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                  Your word:{" "}
                  <span style={{ color: "#059669" }}>
                    {room.currentRound.secretWord}
                  </span>
                </p>
              </div>
            ) : null}

            {isGuesser && !room.currentRound?.secretWord ? (
              <div style={{ marginBottom: "12px" }}>
                <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                  The drawer is drawing...
                </p>
              </div>
            ) : null}

            <Canvas
              strokes={room.canvasState.strokes}
              onStrokesChange={isDrawer ? handleStrokesChange : undefined}
              readOnly={!isDrawer}
              onClear={isDrawer ? handleClearCanvas : undefined}
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
                <dd>
                  {isDrawer
                    ? "Drawer"
                    : isGuesser
                      ? "Guesser"
                      : "Spectator"}
                </dd>
              </div>
            </dl>
          </Card>

          {isGuesser ? (
            <Card title="Your Guess">
              <GuessForm
                onSubmit={handleGuessSubmit}
                disabled={!!hasGuessedCorrectly}
                disabledReason={
                  hasGuessedCorrectly
                    ? "You already guessed correctly!"
                    : undefined
                }
              />
            </Card>
          ) : null}

          {isDrawer ? (
            <div className="button-row button-row--compact">
              <button
                className="button button--secondary"
                onClick={() => navigate("/lobby")}
              >
                Exit Game
              </button>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
