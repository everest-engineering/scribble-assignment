import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function ResultPage() {
  const navigate = useNavigate();
  const store = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (room?.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room?.status]);

  useEffect(() => {
    if (!room) return;
    const interval = setInterval(async () => {
      try {
        await store.fetchRoom();
      } catch {
        // polling failure is non-fatal
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [store, room?.code]);

  if (!room) {
    return null;
  }

  const result = room.result;
  const isHost = participantId === room.hostId;

  return (
    <section className="panel result-page">
      <div className="result-page__header">
        <div className="result-page__header-left">
          <span className="section-kicker">Round Over</span>
          <h1 className="result-page__title">Results</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      {result ? (
        <div className="result-page__content">
          <div className="result-page__word">
            <span className="section-kicker">The word was</span>
            <p className="result-page__revealed-word">{result.revealedWord}</p>
          </div>

          <div className="result-page__scores">
            <h2>Scores</h2>
            <table className="scores-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {room.participants.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}{p.id === participantId ? " (you)" : ""}</td>
                    <td>{result.scores[p.id] ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="result-page__guesses">
            <h2>Guesses</h2>
            {result.guesses.length === 0 ? (
              <p>No guesses were submitted.</p>
            ) : (
              <ul className="guess-list">
                {result.guesses.map((g, i) => (
                  <li key={i} className={`guess-list__item${g.isCorrect ? " guess-list__item--correct" : ""}`}>
                    <span className="guess-list__name">{g.guesserName}:</span>{" "}
                    <span className="guess-list__text">{g.guessText}</span>
                    {g.isCorrect && <span className="guess-list__badge"> ✓</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <p>Loading results…</p>
      )}

      <div className="button-row">
        {isHost && (
          <button className="button button--primary" onClick={() => store.restartGame()}>
            Restart
          </button>
        )}
      </div>
    </section>
  );
}
