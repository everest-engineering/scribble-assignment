import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import type { RoomSnapshot } from "../services/api";
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

    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room || room.status !== "active") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      roomStore.fetchRoom().catch(() => undefined);
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [room, roomStore]);

  if (!room) {
    return null;
  }

  return <GamePageView room={room} participantId={participantId} onExit={() => navigate("/lobby")} />;
}

interface GamePageViewProps {
  room: RoomSnapshot;
  participantId: string | null;
  onExit: () => void;
}

export function GamePageView({ room, participantId, onExit }: GamePageViewProps) {
  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((participant) => participant.id === room.drawerParticipantId) ?? null;
  const isDrawer = room.viewerRole === "drawer";
  const isActive = room.status === "active";
  const title = isDrawer ? "Draw the Word" : "Guess the Word!";
  const statusLabel = isActive ? (isDrawer ? "Drawing" : "Guessing") : "Waiting";

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">{title}</h1>
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
            <div className="canvas-placeholder" style={{ minHeight: "500px", backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
              {isDrawer ? "Your drawing area is ready." : `${drawer?.name ?? "The drawer"} is drawing...`}
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
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
              <div>
                <dt>Drawer</dt>
                <dd>{drawer?.name ?? "Not assigned"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{statusLabel}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Word">
            {isDrawer && room.secretWord ? (
              <p className="secret-word">{room.secretWord}</p>
            ) : (
              <p className="placeholder-note">Hidden from guessers</p>
            )}
          </Card>

          <Card title="Your Guess">
            <GuessForm disabled={!isActive || isDrawer} />
          </Card>
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={onExit}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
