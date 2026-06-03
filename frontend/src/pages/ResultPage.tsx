import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useLobbyPolling } from "../state/useLobbyPolling";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function ResultPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  useLobbyPolling(room?.code ?? null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }
    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room]);

  if (!room || room.status !== "result") {
    return null;
  }

  const round = room.currentRound;
  const isHost = !!participantId && room.hostParticipantId === participantId;
  const sortedGuesses = [...room.guesses].sort((a, b) => a.order - b.order);

  async function handleRestart() {
    try {
      await roomStore.restart();
    } catch (caughtError) {
      console.error(caughtError);
    }
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round Over</span>
          <h1 className="game-page__title">Round Results</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard
            participants={room.participants}
            drawerParticipantId={round?.drawerParticipantId}
          />
        </aside>

        <div className="game-page__main">
          <Card title="The word was" badge="Reveal">
            <p className="secret-word" data-testid="result-secret-word">
              {round?.secretWord ?? "(no round)"}
            </p>
          </Card>

          <Card title="Full guess history">
            {sortedGuesses.length === 0 ? (
              <p>No guesses were submitted this round.</p>
            ) : (
              <ul className="player-list" data-testid="result-guess-history">
                {sortedGuesses.map((entry) => {
                  const guesser =
                    room.participants.find((p) => p.id === entry.guesserParticipantId) ?? null;
                  return (
                    <li key={entry.id}>
                      <span>
                        <strong>{guesser?.name ?? "Unknown"}</strong>: {entry.text}
                      </span>
                      <span className="player-list__meta">
                        {entry.isCorrect ? "correct" : "incorrect"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="What happens next?">
            {isHost ? (
              <>
                <p>You can restart the room to begin a new round.</p>
                <div className="button-row button-row--compact" style={{ marginTop: "12px" }}>
                  <button
                    className="button button--primary"
                    type="button"
                    onClick={handleRestart}
                  >
                    Restart
                  </button>
                </div>
              </>
            ) : (
              <p aria-live="polite">Waiting for the host to restart…</p>
            )}
          </Card>
        </aside>
      </div>
    </section>
  );
}
