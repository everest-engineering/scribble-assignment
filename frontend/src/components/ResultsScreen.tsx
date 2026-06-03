import { useEffect, useState } from "react";
import type { RoomSnapshot } from "shared/schemas/index.js";
import { Card } from "./Card";

interface ResultsScreenProps {
  room: RoomSnapshot;
  participantId: string | null;
  onRestart: () => void;
}

function useCountdown(resultExpiresAt: string | null): number | null {
  const [seconds, setSeconds] = useState<number | null>(() => {
    if (!resultExpiresAt) return null;
    return Math.max(0, Math.ceil((new Date(resultExpiresAt).getTime() - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!resultExpiresAt) {
      setSeconds(null);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((new Date(resultExpiresAt).getTime() - Date.now()) / 1000));
      setSeconds(remaining);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [resultExpiresAt]);

  return seconds;
}

export function ResultsScreen({ room, participantId, onRestart }: ResultsScreenProps) {
  const isHost = participantId === room.hostId;
  const secondsRemaining = useCountdown(room.resultExpiresAt);

  return (
    <section className="panel results-screen">
      <h1 className="results-screen__title">Round Over!</h1>

      <div className="results-screen__word">
        <p>The word was: <strong>{room.currentWord}</strong></p>
      </div>

      <div className="results-screen__layout">
        <Card title="Final Scores">
          <ul className="scoreboard-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {room.participants.map((p) => (
              <li
                key={p.id}
                className="scoreboard-row"
                style={{ display: "flex", justifyContent: "space-between", padding: "0.25rem 0" }}
              >
                <span>{p.name}</span>
                <strong>{room.scores[p.id] ?? 0}</strong>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Guess History">
          {room.guesses.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              No guesses were made this round.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {room.guesses.map((g) => (
                <li
                  key={g.id}
                  className={`guess-entry${g.correct ? " guess-entry--correct" : ""}`}
                  style={{
                    padding: "0.25rem 0",
                    fontSize: "0.875rem",
                    color: g.correct ? "#16a34a" : undefined
                  }}
                >
                  <span className="guess-entry__name" style={{ fontWeight: 600 }}>
                    {g.participantName}
                  </span>
                  {": "}
                  <span className="guess-entry__text">{g.text}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="results-screen__footer">
        {secondsRemaining !== null && (
          <p aria-live="polite" aria-atomic="true" className="results-screen__countdown">
            Returning to lobby in {secondsRemaining}s…
          </p>
        )}

        {isHost && (
          <button
            className="button button--primary"
            onClick={onRestart}
            aria-label="Return to lobby now"
          >
            Return to Lobby
          </button>
        )}
      </div>
    </section>
  );
}
