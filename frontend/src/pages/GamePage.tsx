import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CanvasPlaceholder } from "../components/CanvasPlaceholder";
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

  useEffect(() => {
    if (room) return;
    roomStore.restoreSession().then((restoredRoom) => {
      if (!restoredRoom) {
        roomStore.clearSession();
        navigate("/", { replace: true });
      }
    });
  }, [navigate, room, roomStore]);

  const handleExit = useCallback(() => {
    roomStore.clearSession();
    navigate("/lobby");
  }, [navigate, roomStore]);

  if (!room || !participantId) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = room.drawerId === participantId;
  const drawer = room.participants.find((participant) => participant.id === room.drawerId) ?? null;

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {room.currentRound ?? 1}</span>
          <h1 className="game-page__title">
            {isDrawer ? "Draw the Word!" : "Guess the Word!"}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          {isDrawer ? null : <ResultPanel />}
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <CanvasPlaceholder
              isDrawer={isDrawer}
              drawerName={drawer?.name ?? null}
              secretWord={room.secretWord}
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
                <dt>Drawer</dt>
                <dd>{drawer?.name ?? "Unknown"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>Playing</dd>
              </div>
            </dl>
          </Card>

          {isDrawer ? null : (
            <Card title="Your Guess">
              <GuessForm />
            </Card>
          )}
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={handleExit}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
