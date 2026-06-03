import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";
import { Canvas } from "../components/Canvas";
import { GuessHistory } from "../components/GuessHistory";
import { ResultScreen } from "../components/ResultScreen";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    let interval: number;
    if (room && (room.status === "playing" || room.status === "result")) {
      interval = window.setInterval(() => {
        roomStore.fetchRoom().catch((e) => console.error("Polling failed", e));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [roomStore, room?.code, room?.status]);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    } else if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((p) => p.id === room.drawerId);
  const isDrawer = room.drawerId === participantId;

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {room.roundNumber ?? 1}</span>
          <h1 className="game-page__title">
            {isDrawer ? (
              <>You are drawing: <strong style={{ letterSpacing: '0.1em' }}>{room.secretWord}</strong></>
            ) : (
              <>Guess: <span style={{ letterSpacing: '0.3em' }}>{room.wordLength ? Array(room.wordLength).fill("_").join(" ") : ""}</span></>
            )}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      {room.status === "result" ? (
        <ResultScreen />
      ) : (
        <div className="game-page__layout">
          <aside className="game-page__sidebar game-page__sidebar--left">
            <Scoreboard />
            <ResultPanel />
          </aside>

          <div className="game-page__main">
            <Card title="Canvas">
              <Canvas />
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

            {!isDrawer && (
              <Card title="Your Guess">
                <GuessForm />
              </Card>
            )}

            <GuessHistory />
          </aside>
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
