import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function ResultPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, isLoading } = useRoomState();
  const [restartError, setRestartError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room) return;
    const interval = setInterval(async () => {
      try {
        const updated = await roomStore.fetchRoom();
        if (updated?.status === "lobby") {
          navigate("/lobby");
        }
      } catch {
        // non-fatal poll error
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [room?.code]);

  if (!room) return null;

  const isHost = room.hostId === participantId;

  async function handleRestart() {
    try {
      setRestartError(null);
      await roomStore.restartRoom();
      navigate("/lobby");
    } catch (err) {
      setRestartError(err instanceof Error ? err.message : "Unable to restart");
    }
  }

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <PageHeader
          kicker="Round over"
          title="Results"
          description="Here's how everyone did this round."
        />
        <RoomCodeBadge code={room.code} />
      </div>

      {room.secretWord ? (
        <Card title="The Word Was">
          <p style={{ fontSize: "2rem", fontWeight: "bold", textAlign: "center", padding: "0.5rem" }}>
            {room.secretWord}
          </p>
        </Card>
      ) : null}

      <div className="summary-grid">
        <Scoreboard participants={room.participants} scores={room.scores} />
        <ResultPanel guesses={room.guesses} participants={room.participants} />
      </div>

      {restartError ? <p className="form__error">{restartError}</p> : null}

      <div className="button-row button-row--spread">
        {isHost ? (
          <button
            className="button button--primary"
            disabled={isLoading}
            onClick={handleRestart}
          >
            Restart Game
          </button>
        ) : (
          <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Waiting for host to restart...</p>
        )}
      </div>
    </section>
  );
}
