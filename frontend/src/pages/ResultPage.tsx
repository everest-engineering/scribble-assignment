import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessHistory } from "../components/GuessHistory";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

const RESULT_POLL_INTERVAL_MS = 2000;

export function ResultPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [error, setError] = useState<string | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);

  const isHost = Boolean(room && participantId && room.hostId === participantId);

  const routeByStatus = useCallback(
    (status: string | undefined) => {
      if (status === "lobby") {
        navigate("/lobby", { replace: true });
      } else if (status === "playing") {
        navigate("/game", { replace: true });
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (!room || !participantId) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status !== "result") {
      routeByStatus(room.status);
    }
  }, [navigate, participantId, room, room?.status, routeByStatus]);

  useEffect(() => {
    if (!room || room.status !== "result") {
      return;
    }

    let cancelled = false;

    async function pollRoom() {
      try {
        const snapshot = await roomStore.fetchRoom();
        if (!cancelled && snapshot) {
          setError(null);
          routeByStatus(snapshot.status);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
        }
      }
    }

    void pollRoom();
    const intervalId = window.setInterval(() => {
      void pollRoom();
    }, RESULT_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [room, room?.code, room?.status, roomStore, routeByStatus]);

  async function handleRestart() {
    if (!isHost) {
      return;
    }

    try {
      setIsRestarting(true);
      setError(null);
      const snapshot = await roomStore.restartRoom();
      routeByStatus(snapshot.status);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to restart game");
    } finally {
      setIsRestarting(false);
    }
  }

  if (!room || !participantId || room.status !== "result") {
    return null;
  }

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <PageHeader
          kicker="Round complete"
          title="Results"
          description="The round has ended. Review the answer and scores below."
        />
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="summary-grid">
        <Card title="Correct Word">
          <p className="game-page__secret-word">
            <strong>{room.secretWord ?? "Unknown"}</strong>
          </p>
        </Card>

        <Scoreboard room={room} />
      </div>

      <GuessHistory guesses={room.guesses} />

      {error ? <p className="form__error">{error}</p> : null}

      <div className="button-row button-row--spread">
        {isHost ? (
          <button
            className="button button--primary"
            disabled={isRestarting}
            onClick={handleRestart}
          >
            {isRestarting ? "Restarting..." : "Restart to Lobby"}
          </button>
        ) : (
          <p>Waiting for the host to restart...</p>
        )}
      </div>
    </section>
  );
}
