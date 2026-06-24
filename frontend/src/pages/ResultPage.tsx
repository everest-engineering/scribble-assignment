import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function ResultPage() {
  const navigate = useNavigate();
  const store = useRoomStore();
  const { room, participantId, isLoading } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }
    store.startPolling();
    return () => {
      store.stopPolling();
    };
  }, [navigate, room, store]);

  useEffect(() => {
    if (!room) return;
    if (room.status === "lobby") {
      navigate("/lobby");
    }
  }, [room?.status, room, navigate]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((p) => p.id === participantId) ?? null;
  const isHost = viewer?.isHost ?? false;

  const rankedScores = useMemo(() => {
    const entries = Object.entries(room.scores).map(([id, score]) => {
      const participant = room.participants.find((p) => p.id === id);
      return { participantId: id, name: participant?.name ?? "Unknown", score };
    });
    entries.sort((a, b) => b.score - a.score);
    return entries;
  }, [room.scores, room.participants]);

  const winningGuess = useMemo(() => {
    const correct = room.guesses.find((g) => g.isCorrect);
    return correct ?? null;
  }, [room.guesses]);

  async function handleRestart() {
    try {
      await store.restartGame();
    } catch {
      // error handled by store
    }
  }

  return (
    <section className="panel result-page">
      <div className="result-page__header">
        <div className="result-page__header-left">
          <span className="section-kicker">Round {room.roundNumber ?? 1} Complete</span>
          <h1 className="result-page__title">Round Results</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <Card title="The Word Was">
        <div className="word-display word-display--result">{room.currentWord ?? "—"}</div>
      </Card>

      <div className="result-page__layout">
        <Card title="Final Scores">
          {rankedScores.length === 0 ? (
            <p>No scores to display.</p>
          ) : (
            <ol className="score-list score-list--ranked">
              {rankedScores.map((entry, index) => (
                <li key={entry.participantId} className="score-list__item">
                  <span className="score-list__rank">{index + 1}.</span>
                  <span className="score-list__name">{entry.name}</span>
                  <span className="score-list__score">{entry.score}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title="Guess History">
          {room.guesses.length === 0 ? (
            <p>No guesses were submitted this round.</p>
          ) : (
            <ul className="guess-history">
              {room.guesses.map((guess, index) => (
                <li
                  key={index}
                  className={`guess-history__item ${guess.isCorrect ? "guess-history__item--correct" : ""}`}
                >
                  <span className="guess-history__guesser">{guess.guesserName}</span>
                  <span className="guess-history__text">{guess.text}</span>
                  <span className="guess-history__result">
                    {guess.isCorrect ? "✓ Correct" : "✗ Incorrect"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {winningGuess ? (
        <Card title="Winning Guess">
          <p>
            <strong>{winningGuess.guesserName}</strong> guessed correctly:{" "}
            <em>{winningGuess.text}</em>
          </p>
        </Card>
      ) : null}

      <div className="button-row">
        {isHost ? (
          <button
            className="button button--primary"
            disabled={isLoading}
            onClick={handleRestart}
          >
            {isLoading ? "Restarting..." : "Restart / Play Again"}
          </button>
        ) : (
          <p className="waiting-message">Waiting for the host to restart the game...</p>
        )}
      </div>
    </section>
  );
}
