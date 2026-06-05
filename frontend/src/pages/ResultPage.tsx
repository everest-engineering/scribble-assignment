import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function ResultPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, isLoading } = useRoomState();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  // Keep the result view in sync; a restart flips status to "lobby" for everyone.
  useEffect(() => {
    roomStore.startPolling(2000);
    return () => roomStore.stopPolling();
  }, [roomStore]);

  useEffect(() => {
    if (room?.status === "lobby") {
      navigate("/lobby", { replace: true });
    } else if (room?.status === "playing") {
      navigate("/game", { replace: true });
    }
  }, [navigate, room?.status]);

  if (!room) {
    return null;
  }

  async function handleRestart() {
    if (!participantId) {
      return;
    }
    try {
      setError(null);
      await roomStore.restartRound(participantId);
      navigate("/lobby");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to restart");
    }
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round over</span>
          <h1 className="game-page__title">Results</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="summary-grid">
        <Card title="The word was">
          <p className="status-line" style={{ backgroundColor: "#e0e7ff", color: "#3730a3" }}>
            <strong>{room.secretWord ?? "—"}</strong>
          </p>
        </Card>

        <Scoreboard scores={room.scores} />
      </div>

      <Card title="Guess history">
        {room.guesses.length === 0 ? (
          <p>No guesses were made.</p>
        ) : (
          <ul className="player-list">
            {room.guesses.map((guess) => (
              <li key={guess.id}>
                <span>
                  <strong>{guess.participantName}:</strong> {guess.text}
                </span>
                <span className="player-list__meta">{guess.correct ? "✓ correct" : "✗"}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {error ? <p className="form__error">{error}</p> : null}

      <div className="button-row">
        {room.canRestart ? (
          <button className="button button--primary" disabled={isLoading} onClick={handleRestart}>
            {isLoading ? "Restarting..." : "Restart Game"}
          </button>
        ) : (
          <p>Waiting for the host to restart the game.</p>
        )}
      </div>
    </section>
  );
}
