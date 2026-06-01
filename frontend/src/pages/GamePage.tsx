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
      return;
    }

    if (room.status !== "active") {
      navigate("/lobby", { replace: true });
      return;
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room || room.status !== "active") {
      return undefined;
    }

    async function refresh() {
      try {
        await roomStore.fetchRoom();
      } catch {
        // errors are handled by store state
      }
    }

    refresh();
    const interval = window.setInterval(refresh, 2000);
    return () => {
      window.clearInterval(interval);
    };
  }, [room?.code, room?.status, roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = room.drawerId === viewer?.id;
  const drawer = room.participants.find((participant) => participant.id === room.drawerId) ?? null;

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
          <Card title={isDrawer ? "Canvas" : "Drawing"}>
            <DrawingCanvas readOnly={!isDrawer} />
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
                <dt>Current drawer</dt>
                <dd>{drawer?.name ?? "Unknown"}</dd>
              </div>
              {isDrawer && room.secretWord ? (
                <>
                  <div>
                    <dt>Secret word</dt>
                    <dd>{room.secretWord}</dd>
                  </div>
                  <div>
                    <dt>Tip</dt>
                    <dd>Only you can see this word.</dd>
                  </div>
                </>
              ) : null}
            </dl>
          </Card>

          {!isDrawer ? (
            <Card title="Your Guess">
              <GuessForm />
            </Card>
          ) : null}
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
