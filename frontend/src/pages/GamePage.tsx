import { useEffect, useState } from "react";
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
  const [isRestoring, setIsRestoring] = useState(true);

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

  // Poll for room updates every 2 seconds while mounted
  useEffect(() => {
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
  }, [roomStore, navigate, room?.code]);

  if (!room || isRestoring) {
    return null;
  }

  const viewer =
    room.participants.find((participant) => participant.id === participantId) ??
    null;

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
            <div
              className="canvas-placeholder"
              style={{
                minHeight: "500px",
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
              }}
            >
              Waiting for drawer...
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
                <dt>Status</dt>
                <dd>Playing</dd>
              </div>
            </dl>
          </Card>

          <Card title="Your Guess">
            <GuessForm />
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
