import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { GuessHistory } from "../components/GuessHistory";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function ResultsPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  const isHost = room !== null && participantId !== null && room.hostId === participantId;

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
    if (!room?.code) return;

    const interval = setInterval(async () => {
      try {
        await roomStore.fetchRoom();
      } catch {
        // retain stale data; retry on next cycle
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [room?.code, roomStore]);

  async function handleRestart() {
    try {
      await roomStore.restartRoom();
      navigate("/lobby");
    } catch {
      // error handled via store state
    }
  }

  if (!room) {
    return null;
  }

  const sortedScores = [...room.playerScores].sort((a, b) => b.score - a.score);

  return (
    <section className="panel results-page">
      <div className="results-page__header">
        <PageHeader
          kicker="Round Complete"
          title="Results"
          description="Here is how everyone did this round."
        />
        <RoomCodeBadge code={room.code} />
      </div>

      <Card title="The Word">
        <p className="results-page__word">{room.currentWord ?? "—"}</p>
      </Card>

      <div className="summary-grid">
        <Card title="Final Scores">
          <Scoreboard playerScores={sortedScores} />
        </Card>

        <Card title="Guess History">
          <GuessHistory guesses={room.guesses} />
        </Card>
      </div>

      <div className="button-row button-row--spread">
        {isHost ? (
          <button className="button button--primary" onClick={handleRestart}>
            Restart Game
          </button>
        ) : (
          <p className="results-page__waiting">Waiting for the host to restart…</p>
        )}
        <button className="button button--secondary" onClick={() => {
          roomStore.clearRoom();
          navigate("/");
        }}>
          Leave Room
        </button>
      </div>
    </section>
  );
}
