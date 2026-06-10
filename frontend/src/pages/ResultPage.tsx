import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL_MS = 2000;

export function ResultPage() {
  const navigate = useNavigate();
  const store = useRoomStore();
  const { room, participantId } = useRoomState();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  const viewer = room?.participants.find((p) => p.id === participantId) ?? null;
  const isHost = viewer?.isHost ?? false;

  const scheduleNextPoll = useCallback(() => {
    timeoutRef.current = setTimeout(async () => {
      const polled = await store.pollRoom();
      if (polled?.status === "lobby") {
        navigate("/lobby");
        return;
      }
      scheduleNextPoll();
    }, POLL_INTERVAL_MS);
  }, [store, navigate]);

  useEffect(() => {
    if (!room) return;

    scheduleNextPoll();

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!room) {
    return null;
  }

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <PageHeader
          kicker="Game Over"
          title={room.secretWord ?? ""}
          description="Here's how everyone did this round."
        />
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="summary-grid">
        <Card title="Scores">
          {room.participants.length === 0 ? (
            <p className="placeholder-block">No players.</p>
          ) : (
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>{participant.name}</span>
                  <span className="player-list__meta">
                    {room.scores[participant.name] ?? 0} pts
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Guess History">
          {room.guesses.length === 0 ? (
            <p className="placeholder-block">No guesses yet.</p>
          ) : (
            <ul className="detail-list">
              {room.guesses.map((guess, index) => (
                <li key={index}>
                  <span>{guess.playerName}: </span>
                  <span>{guess.text}</span>
                  <strong> ({guess.points} pts)</strong>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="button-row">
        {isHost && (
          <button
            className="button button--primary"
            onClick={async () => {
              if (viewer) {
                await store.restartGame(viewer.name);
                navigate("/lobby");
              }
            }}
          >
            Play Again
          </button>
        )}
      </div>
    </section>
  );
}
