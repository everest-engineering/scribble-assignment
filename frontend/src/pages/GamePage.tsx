import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "../components/Canvas";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { ResultView } from "../components/ResultView";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, canvasStrokes } = useRoomState();
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room) return;
    hasNavigatedRef.current = false;

    const roomInterval = setInterval(async () => {
      try {
        const updatedRoom = await roomStore.fetchRoom();
        if (updatedRoom && updatedRoom.status === "lobby" && !hasNavigatedRef.current) {
          hasNavigatedRef.current = true;
          navigate("/lobby", { replace: true });
        }
      } catch {
        // poll error — keep trying
      }
    }, 2000);

    return () => {
      clearInterval(roomInterval);
    };
  }, [room, roomStore, navigate]);

  useEffect(() => {
    if (!room || !room.currentDrawerId) return;
    if (room.status !== "playing") return;

    const isViewerDrawer = participantId === room.currentDrawerId;
    if (isViewerDrawer) return;

    const canvasInterval = setInterval(async () => {
      try {
        await roomStore.fetchCanvas();
      } catch {
        // poll error — keep trying
      }
    }, 1000);

    return () => {
      clearInterval(canvasInterval);
    };
  }, [room, participantId, roomStore]);

  const handleStrokesChange = useCallback(
    async (strokes: import("../services/api").Stroke[]) => {
      await roomStore.saveCanvas(strokes);
    },
    [roomStore]
  );

  const handleClear = useCallback(async () => {
    await roomStore.clearCanvas();
  }, [roomStore]);

  const handleEndRound = useCallback(async () => {
    await roomStore.endRound();
  }, [roomStore]);

  if (!room) {
    return null;
  }

  if (room.status === "result") {
    return <ResultView />;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((participant) => participant.id === room.currentDrawerId) ?? null;
  const isDrawer = participantId !== null && room.currentDrawerId === participantId;
  const title = isDrawer ? "Draw the Word!" : "Guess the Word!";

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {room.roundNumber}</span>
          <h1 className="game-page__title">{title}</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      {isDrawer && room.secretWord && (
        <div className="game-page__secret-word">
          <span className="secret-word__label">Your word:</span>
          <span className="secret-word__value">{room.secretWord}</span>
        </div>
      )}

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <Canvas
              strokes={canvasStrokes}
              isDrawer={isDrawer}
              onStrokesChange={handleStrokesChange}
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
            <GuessForm isDrawer={isDrawer} />
          </Card>
        </aside>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
        {isDrawer && (
          <button className="button button--primary" onClick={handleEndRound}>
            End Round
          </button>
        )}
      </div>
    </section>
  );
}
