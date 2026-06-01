import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";
import { GuessList } from "../components/GuessList";
import DrawerCanvas from "../components/DrawerCanvas";

export function GamePage() {
  const navigate = useNavigate();
  const { room, participantId } = useRoomState();
  const store = useRoomStore();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (room) {
      if (typeof (store as any).startGuessPolling === "function") {
        (store as any).startGuessPolling();
      }
      if (typeof (store as any).startSnapshotPolling === "function") {
        (store as any).startSnapshotPolling();
      }
      return () => {
        if (typeof (store as any).stopGuessPolling === "function") {
          (store as any).stopGuessPolling();
        }
        if (typeof (store as any).stopSnapshotPolling === "function") {
          (store as any).stopSnapshotPolling();
        }
      };
    }
    return undefined;
  }, [room?.code]);

  if (!room) {
    return null;
  }

  const viewer =
    room.participants.find((participant) => participant.id === participantId) ??
    null;
  const drawer = room.participants.find((p) => p.id === room.drawerId) ?? null;

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
          <Card title="Canvas">
            <DrawerCanvas />
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
                <dd>{drawer ? drawer.name : "TBD"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>Playing</dd>
              </div>
            </dl>
          </Card>

          {room.secretWord && (
            <Card title="Secret Word">
              <div className="secret-word">{room.secretWord}</div>
            </Card>
          )}

          <Card title="Your Guess">
            <GuessForm
              roomCode={room.code}
              participantId={participantId ?? undefined}
            />
            <div style={{ marginTop: 12 }}>
              <GuessList />
            </div>
          </Card>
        </aside>
      </div>

      <div className="button-row">
        <button
          className="button button--secondary"
          onClick={() => navigate("/lobby")}
        >
          Exit Game
        </button>
      </div>
    </section>
  );
}
