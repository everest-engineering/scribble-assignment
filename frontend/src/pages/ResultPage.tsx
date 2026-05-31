import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function ResultPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [restartError, setRestartError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      roomStore.fetchRoom().catch(() => {
        // Silent: polling recovers on next interval
      });
    }, 2000);

    return () => clearInterval(intervalId);
  }, [roomStore]);

  useEffect(() => {
    if (room?.status === "lobby") {
      navigate("/lobby");
    }
  }, [navigate, room?.status]);

  async function handleRestart() {
    try {
      setRestartError(null);
      await roomStore.restartGame();
    } catch (caughtError) {
      setRestartError(caughtError instanceof Error ? caughtError.message : "Unable to restart");
    }
  }

  if (!room) {
    return null;
  }

  const isHost = room.hostId === participantId;

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round over</span>
          <h1 className="game-page__title">Results</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      {room.secretWord && (
        <div className="game-page__drawer-banner">
          The word was: <strong>{room.secretWord}</strong>
        </div>
      )}

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <Card title="Round Summary">
            <dl className="detail-list">
              <div>
                <dt>Secret word</dt>
                <dd>{room.secretWord ?? "—"}</dd>
              </div>
              <div>
                <dt>Total guesses</dt>
                <dd>{room.guesses.length}</dd>
              </div>
            </dl>

            {restartError && (
              <p style={{ color: "#dc2626", marginTop: "8px" }}>{restartError}</p>
            )}

            {isHost && (
              <div style={{ marginTop: "16px" }}>
                <button className="button button--primary" onClick={handleRestart}>
                  Play Again
                </button>
              </div>
            )}
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Players">
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>{participant.name}</span>
                  <strong>{room.scores[participant.id] ?? 0} pts</strong>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </section>
  );
}
