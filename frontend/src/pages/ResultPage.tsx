import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function ResultPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [pollError, setPollError] = useState<string | null>(null);
  const [restartError, setRestartError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    } else if (room.status === "lobby") {
      navigate("/lobby");
    }
  }, [navigate, room?.status]);

  useEffect(() => {
    if (!room) return;
    intervalRef.current = setInterval(async () => {
      try {
        await roomStore.fetchRoom();
        setPollError(null);
      } catch (err) {
        setPollError(err instanceof Error ? err.message : "Unable to refresh");
      }
    }, 2000);
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [room?.code]);

  if (!room) return null;

  const isHost = participantId === room.hostId;
  const guesses = room.guesses ?? [];
  const scores = room.scores ?? {};
  const participants = room.participants ?? [];

  async function handleRestart() {
    try {
      setRestartError(null);
      await roomStore.restartGame();
    } catch (err) {
      setRestartError(err instanceof Error ? err.message : "Unable to restart");
    }
  }

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <PageHeader
          kicker="Round complete"
          title="Results"
          description="The round has ended. See how everyone did!"
        />
        <RoomCodeBadge code={room.code} />
      </div>

      {room.currentWord ? (
        <div style={{ margin: "0 0 16px", padding: "12px 16px", backgroundColor: "#dcfce7", borderRadius: "8px", textAlign: "center" }}>
          <span style={{ fontSize: "0.875rem", color: "#15803d" }}>The secret word was</span>
          <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#166534", margin: "4px 0 0" }}>
            {room.currentWord}
          </p>
        </div>
      ) : null}

      {pollError ? <p className="form__error" style={{ marginBottom: "8px" }}>{pollError}</p> : null}
      {restartError ? <p className="form__error" style={{ marginBottom: "8px" }}>{restartError}</p> : null}

      <div className="summary-grid">
        <Card title="Final Scores">
          {participants.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No scores available.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
              {participants.map((p) => (
                <li
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    borderRadius: "4px",
                    backgroundColor: "#f9fafb",
                    fontSize: "0.9rem"
                  }}
                >
                  <span>{p.name}{p.id === room.hostId ? " (host)" : ""}</span>
                  <strong>{scores[p.id] ?? 0} pts</strong>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Guess History">
          {guesses.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No guesses were submitted.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
              {guesses.map((g, i) => {
                const name = participants.find((p) => p.id === g.participantId)?.name ?? "Unknown";
                return (
                  <li
                    key={i}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      backgroundColor: g.isCorrect ? "#dcfce7" : "#f9fafb",
                      color: g.isCorrect ? "#15803d" : "#374151",
                      fontSize: "0.875rem"
                    }}
                  >
                    <strong>{name}</strong>: {g.text} {g.isCorrect ? "✓" : "✗"}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <span />
        {isHost ? (
          <button className="button button--primary" onClick={handleRestart}>
            Play Again
          </button>
        ) : (
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Waiting for the host to restart…</p>
        )}
      </div>
    </section>
  );
}
