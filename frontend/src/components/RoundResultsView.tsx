import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "./Card";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function RoundResultsView() {
  const navigate = useNavigate();
  const store = useRoomStore();
  const { room, participantId } = useRoomState();
  const [restartError, setRestartError] = useState<string | null>(null);

  if (!room) {
    return null;
  }

  const isHost = room.hostId === participantId;
  const hostName = room.participants.find((p) => p.id === room.hostId)?.name ?? "host";

  const sortedParticipants = [...room.participants].sort(
    (a, b) => (room.scores[b.id] ?? 0) - (room.scores[a.id] ?? 0)
  );

  async function handleRestart() {
    try {
      await store.restartRoom();
      navigate("/lobby");
    } catch (error) {
      setRestartError(error instanceof Error ? error.message : "Failed to restart game");
    }
  }

  return (
    <section className="panel">
      <div style={{ marginBottom: "24px" }}>
        <span className="section-kicker">Round Over</span>
        <h1 style={{ margin: "4px 0 0" }}>Results</h1>
      </div>

      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr 1fr" }}>
        <Card title="The Word Was">
          <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
            {room.secretWord ?? "—"}
          </p>
        </Card>

        <Card title="Final Scores">
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {sortedParticipants.map((p) => (
              <li
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 0",
                  fontSize: "0.875rem"
                }}
              >
                <span>{p.name}</span>
                <strong>{room.scores[p.id] ?? 0}</strong>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Guess History">
        {room.guesses.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No guesses were submitted.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {room.guesses.map((g, index) => (
              <li
                key={index}
                style={{
                  padding: "4px 8px",
                  marginBottom: "4px",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                  backgroundColor: g.correct ? "#dcfce7" : "#fee2e2",
                  color: g.correct ? "#166534" : "#991b1b"
                }}
              >
                {g.participantName}: {g.text}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div style={{ marginTop: "16px" }}>
        {isHost ? (
          <div>
            <button className="button button--primary" onClick={handleRestart}>
              Restart
            </button>
            {restartError ? (
              <p style={{ color: "#991b1b", fontSize: "0.875rem", marginTop: "8px" }}>
                {restartError}
              </p>
            ) : null}
          </div>
        ) : (
          <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            Waiting for {hostName} to restart…
          </p>
        )}
      </div>
    </section>
  );
}
