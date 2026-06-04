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
  const { room, participantId } = useRoomState();
  const cleanupArmedRef = useRef(false);

  useEffect(() => {
    if (!room && !participantId) {
      navigate("/", { replace: true });
      return;
    }

    if (room?.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, participantId, room]);

  useEffect(() => {
    if (!room?.code || !participantId) {
      return;
    }

    cleanupArmedRef.current = false;
    const cleanupTimerId = window.setTimeout(() => {
      cleanupArmedRef.current = true;
    }, 0);

    const handleBeforeUnload = () => {
      void roomStore.leaveRoom();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);

    return () => {
      window.clearTimeout(cleanupTimerId);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);

      if (cleanupArmedRef.current) {
        void roomStore.leaveRoom();
      }
    };
  }, [participantId, room?.code, roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((participant) => participant.id === room.currentDrawerId) ?? null;
  const viewerRole = viewer?.role ?? (viewer?.id === room.currentDrawerId ? "drawer" : null);
  const isDrawer = viewerRole === "drawer";

  async function handleExitGame() {
    await roomStore.leaveRoom();
    navigate("/", { replace: true });
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
          <Scoreboard room={room} participantId={participantId} />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas" badge={drawer ? `Drawer: ${drawer.name}` : "Waiting"}>
            <div className="canvas-placeholder">
              Waiting for drawer to start sketching...
            </div>
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
                <dd>{viewerRole ?? "Unknown"}</dd>
              </div>
              <div>
                <dt>Drawer</dt>
                <dd>{drawer?.name ?? "Unknown drawer"}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Secret Word" badge={isDrawer ? "Visible to drawer" : "Hidden"}>
            {isDrawer ? (
              <div className="word-reveal">{room.currentWord ?? "Unavailable"}</div>
            ) : (
              <div className="word-mask">
                <span className="word-mask__text">Hidden from guessers</span>
              </div>
            )}
          </Card>

          <Card title="Your Guess">
            <GuessForm />
          </Card>
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={handleExitGame}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
