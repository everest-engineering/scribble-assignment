import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { api } from "../services/api";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function ResultsPage() {
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
    if (room?.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [room?.status, navigate]);

  useEffect(() => {
    const id = setInterval(() => {
      roomStore.fetchRoom().catch(() => {});
    }, 2000);
    return () => clearInterval(id);
  }, [roomStore]);

  if (!room) {
    return null;
  }

  const isHost = participantId !== null && participantId === room.hostId;

  async function handleRestart() {
    if (!room || !participantId) return;
    setRestartError(null);
    try {
      const response = await api.restartGame(room.code, participantId);
      roomStore.setRoomSession(response);
      navigate("/lobby");
    } catch (err) {
      setRestartError(err instanceof Error ? err.message : "Failed to restart game");
    }
  }

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <div>
          <span className="section-kicker">Round Over</span>
          <h1 style={{ margin: "4px 0 8px" }}>Game Over</h1>
          <p style={{ fontSize: "1.125rem" }}>
            The word was: <strong>{room.currentWord ?? "—"}</strong>
          </p>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="summary-grid">
        <Scoreboard scores={room.scores} participants={room.participants} />
        <ResultPanel guesses={room.guesses} />
      </div>

      <div className="button-row button-row--spread">
        {isHost ? (
          <>
            <button className="button button--primary" onClick={handleRestart}>
              Play Again
            </button>
            {restartError && <p style={{ color: "red", marginTop: "8px" }}>{restartError}</p>}
          </>
        ) : (
          <p>Waiting for host to restart...</p>
        )}
      </div>

      <Card title="Room Info">
        <dl className="detail-list">
          <div>
            <dt>Players</dt>
            <dd>{room.participants.map((p) => p.name).join(", ")}</dd>
          </div>
        </dl>
      </Card>
    </section>
  );
}
