import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessHistory } from "../components/GuessHistory";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { RESULT_POLL_MS } from "../constants/game";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function ResultPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, isLoading } = useRoomState();
  const [hydrated, setHydrated] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isHost = room?.viewer?.isHost ?? false;

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!room) {
        const restored = await roomStore.hydrateFromSession();
        if (!cancelled && !restored) {
          navigate("/", { replace: true });
        }
      }

      if (!cancelled) {
        setHydrated(true);
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [navigate, room, roomStore]);

  useEffect(() => {
    if (room?.status === "lobby") {
      navigate("/lobby", { replace: true });
    }

    if (room?.status === "drawing") {
      navigate("/game", { replace: true });
    }
  }, [navigate, room?.status]);

  useEffect(() => {
    if (!room || !participantId || room.status !== "result") {
      return;
    }

    void roomStore.fetchRoom().catch(() => undefined);

    const intervalId = window.setInterval(() => {
      void roomStore.fetchRoom().catch(() => undefined);
    }, RESULT_POLL_MS);

    return () => window.clearInterval(intervalId);
  }, [participantId, room?.code, room?.status, roomStore]);

  async function handleRestart() {
    if (!isHost) {
      return;
    }

    try {
      setActionError(null);
      await roomStore.restartGame();
      navigate("/lobby", { replace: true });
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error ? caughtError.message : "Unable to restart game"
      );
    }
  }

  if (!hydrated || !room || room.status !== "result") {
    return null;
  }

  return (
    <section className="panel placeholder-page result-page">
      <div className="lobby-header">
        <PageHeader
          kicker={`Round ${room.roundNumber ?? 1} complete`}
          title="Round Results"
          description="Everyone sees the same word, scores, and guess history."
        />
        <RoomCodeBadge code={room.code} prominent />
      </div>

      <Card title="The Word Was">
        <p className="secret-word result-page__word">{room.revealedWord ?? "—"}</p>
      </Card>

      <div className="summary-grid">
        <Scoreboard />
        <GuessHistory />
      </div>

      <div className="button-row button-row--spread">
        {isHost ? (
          <button
            className="button button--primary"
            disabled={isLoading}
            onClick={() => void handleRestart()}
          >
            Restart to Lobby
          </button>
        ) : (
          <p className="lobby-guest-note">Waiting for the host to restart the game.</p>
        )}
      </div>

      {actionError ? <p className="form__error">{actionError}</p> : null}
    </section>
  );
}
