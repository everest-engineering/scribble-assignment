import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function ResultPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const updated = await roomStore.fetchRoom();
        if (updated?.status === "lobby") {
          navigate("/lobby", { replace: true });
        }
      } catch {
        navigate("/", { replace: true });
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [navigate, room, roomStore]);

  if (!room) {
    return null;
  }

  return (
    <section className="panel result-page">
      <div className="result-page__header">
        <div className="result-page__header-left">
          <span className="section-kicker">Round Over</span>
          <h1 className="result-page__title">Results</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="result-page__word">
        <span className="result-page__word-label">The word was:</span>
        <span className="result-page__word-value">
          {room.revealedWord ?? "(unknown)"}
        </span>
      </div>

      <div className="result-page__layout">
        <div className="result-page__main">
          <ResultPanel
            guesses={room.guesses ?? []}
            participants={room.participants}
          />
        </div>

        <div className="result-page__sidebar">
          <Scoreboard
            participants={room.participants}
            scores={room.scores ?? {}}
          />
        </div>
      </div>

      <div className="button-row">
        {participantId === room.hostId && (
          <button
            className="button button--primary"
            type="button"
            onClick={() => {
              roomStore
                .restartRoom(room.code, participantId ?? "")
                .catch(() => {});
            }}
          >
            Restart Game
          </button>
        )}
      </div>
    </section>
  );
}
