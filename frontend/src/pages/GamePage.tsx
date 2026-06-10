import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";
import type { CanvasActionSubmission } from "../services/api";

const POLL_INTERVAL_MS = 2000;

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  const doPoll = useCallback(async () => {
    try {
      const updatedRoom = await roomStore.fetchRoom();
      if (updatedRoom) {
        if (updatedRoom.status === "results") {
          navigate("/results");
        } else if (updatedRoom.status !== "playing") {
          navigate("/lobby");
        }
      }
    } catch {
      // polling error — continue silently
    }
  }, [navigate, roomStore]);

  useEffect(() => {
    doPoll();
    pollingRef.current = setInterval(doPoll, POLL_INTERVAL_MS);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [doPoll]);

  if (!room) {
    return null;
  }

  const drawer = room.participants.find((p) => p.id === room.drawerId) ?? null;
  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = participantId === room.drawerId;

  const handleStrokeComplete = useCallback(
    async (action: CanvasActionSubmission) => {
      try {
        await roomStore.submitCanvasAction(action);
      } catch {
        // stroke submit failed silently
      }
    },
    [roomStore]
  );

  const handleClear = useCallback(async () => {
    try {
      await roomStore.submitCanvasAction({ type: "clear" });
    } catch {
      // clear submit failed silently
    }
  }, [roomStore]);

  const handleSubmitGuess = useCallback(
    async (text: string) => {
      const result = await roomStore.submitGuess(text);
      if (!result.correct) {
        throw new Error("Incorrect guess");
      }
    },
    [roomStore]
  );

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
          <Scoreboard participants={room.participants} scores={room.scores} drawerId={room.drawerId} />
          <ResultPanel guessHistory={room.guessHistory} participants={room.participants} />
        </aside>

        <div className="game-page__main">
          <Card title={isDrawer ? `Draw: ${room.secretWord}` : "Canvas"}>
            <DrawingCanvas
              isDrawer={isDrawer}
              canvasActions={room.canvasActions}
              onStrokeComplete={handleStrokeComplete}
              onClear={handleClear}
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
                <dd>Playing</dd>
              </div>
              <div>
                <dt>Drawer</dt>
                <dd>{drawer?.name ?? "Unknown"}</dd>
              </div>
            </dl>
          </Card>

          <Card title={isDrawer ? "Your Word" : "Your Guess"}>
            {isDrawer ? (
              <p className="secret-word">{room.secretWord}</p>
            ) : (
              <GuessForm onSubmitGuess={handleSubmitGuess} />
            )}
          </Card>
        </aside>
      </div>

      {room.roundOver && (
        <div className="round-over-banner">
          <p>The round is over! All guessers have guessed correctly.</p>
        </div>
      )}

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
