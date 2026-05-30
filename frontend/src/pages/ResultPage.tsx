import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useResultPolling } from "../hooks/useResultPolling";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function ResultPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, error, isLoading } = useRoomState();
  const pollError = useResultPolling();
  const [restartError, setRestartError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "playing") {
      navigate("/game", { replace: true });
      return;
    }

    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room]);

  async function handleRestart() {
    if (!room?.isHost) {
      return;
    }

    try {
      setRestartError(null);
      await roomStore.restartRoom();
    } catch (caughtError) {
      setRestartError(
        caughtError instanceof Error ? caughtError.message : "Unable to restart game"
      );
    }
  }

  if (!room || room.status !== "results") {
    return null;
  }

  const statusMessage = error ?? restartError ?? pollError;

  return (
    <section className="panel result-page">
      <div className="result-page__header">
        <div className="result-page__header-left">
          <span className="section-kicker">Round complete</span>
          <h1 className="result-page__title">Results</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <Card title="Secret Word">
        <p className="result-page__word">{room.secretWord ?? "—"}</p>
      </Card>

      {statusMessage ? <p className="form__error">{statusMessage}</p> : null}

      <div className="result-page__layout">
        <Scoreboard room={room} />
        <ResultPanel guesses={room.guesses} />

        <Card title="Participants">
          <ul className="player-list">
            {room.participants.map((participant) => (
              <li key={participant.id}>
                <span>{participant.name}</span>
                <span
                  className={
                    participant.isHost ? "player-list__meta player-list__meta--host" : "player-list__meta"
                  }
                >
                  {participant.isHost ? "host" : "player"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" type="button" onClick={() => navigate("/lobby")}>
          Back to Lobby
        </button>
        {room.isHost ? (
          <button
            className="button button--primary"
            type="button"
            disabled={isLoading}
            onClick={handleRestart}
          >
            {isLoading ? "Restarting..." : "Restart Game"}
          </button>
        ) : null}
      </div>
    </section>
  );
}
