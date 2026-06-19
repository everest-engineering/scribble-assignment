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

  // Auto-refresh the game (~2s polling) so guess history and scores stay in sync for all players.
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void roomStore.fetchRoom().catch(() => undefined);
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((participant) => participant.id === room.drawerId) ?? null;
  const isDrawer = room.role === "drawer";
  const isHost = participantId !== null && room.hostId === participantId;
  const isResult = room.status === "result";

  async function handleEnd() {
    try {
      await roomStore.endRound();
    } catch {
      // errors surface via room state; ignore here
    }
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
          {isResult ? (
            <Card title="Round Over">
              <p style={{ fontSize: "1.125rem" }}>
                The word was <strong>{room.word ?? "—"}</strong>.
              </p>
              <p style={{ color: "#6b7280" }}>
                Final scores and the full guess history are shown on the left.
              </p>
            </Card>
          ) : (
            <DrawingCanvas enabled={isDrawer} />
          )}
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Drawer</dt>
                <dd>{drawer ? `${drawer.name}${isDrawer ? " (you)" : ""}` : "Not assigned"}</dd>
              </div>
              <div>
                <dt>Your role</dt>
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
              {isDrawer ? (
                <div>
                  <dt>Your word</dt>
                  <dd>{room.word ?? "—"}</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          {!isDrawer && !isResult ? (
            <Card title="Your Guess">
              <GuessForm />
            </Card>
          ) : null}
        </aside>
      </div>

      <div className="button-row">
        {isHost && room.status === "active" ? (
          <button className="button button--primary" onClick={handleEnd}>
            End Round
          </button>
        ) : null}
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
