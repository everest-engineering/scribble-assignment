import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function ResultsPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, error, isLoading, participantId } = useRoomState();

  const isHost = room && participantId === room.hostId;

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    } else if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
    } else if (room.status === "active") {
      navigate("/game", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room || room.status !== "results") return;

    const intervalId = setInterval(async () => {
      try {
        await roomStore.fetchRoom();
      } catch (err) {
        // Silently catch polling issues
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [room, roomStore]);

  async function handleRestart() {
    try {
      await roomStore.restartGame();
      navigate("/lobby");
    } catch (caughtError) {
      // Handled by store/errors
    }
  }

  if (!room) {
    return null;
  }

  // Sort participants by score descending to show final rankings
  const sortedParticipants = [...room.participants].sort((a, b) => b.score - a.score);
  const highestScore = sortedParticipants[0]?.score ?? 0;

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <PageHeader
          kicker="Round Complete"
          title="Game Results"
          description="Behold the final scores and guess logs for this round!"
        />
        <RoomCodeBadge code={room.code} />
      </div>

      <div style={{
        background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
        padding: "24px",
        borderRadius: "12px",
        textAlign: "center",
        border: "1px solid #a5b4fc",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
      }}>
        <span style={{
          textTransform: "uppercase",
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "#4f46e5",
          letterSpacing: "0.05em"
        }}>
          Secret Word Revealed
        </span>
        <h2 style={{
          margin: "8px 0 0",
          fontSize: "2.25rem",
          color: "#1e1b4b",
          fontWeight: 800,
          letterSpacing: "0.05em",
          textTransform: "uppercase"
        }}>
          {room.wordTemplate || "Unknown"}
        </h2>
      </div>

      <div className="summary-grid">
        <Card title="Final Scoreboard">
          <ul className="player-list">
            {sortedParticipants.map((participant, index) => {
              const isWinner = participant.score > 0 && participant.score === highestScore;
              return (
                <li key={participant.id} style={{
                  borderColor: isWinner ? "#f59e0b" : undefined,
                  background: isWinner ? "#fffbeb" : undefined
                }}>
                  <span style={{ fontWeight: isWinner ? 700 : 500 }}>
                    {index + 1}. {participant.name}
                    {participant.id === room.hostId ? " (Host)" : ""}
                    {isWinner ? " 👑" : ""}
                  </span>
                  <span className="player-list__meta" style={{
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: isWinner ? "#d97706" : "#4f46e5"
                  }}>
                    {participant.score} pts
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="Guess History Log">
          {room.guesses.length === 0 ? (
            <p style={{ fontStyle: "italic", color: "var(--ink-soft)" }}>No guesses were submitted this round.</p>
          ) : (
            <div style={{
              maxHeight: "300px",
              overflowY: "auto",
              display: "grid",
              gap: "8px",
              paddingRight: "8px"
            }}>
              {room.guesses.map((guess) => (
                <div
                  key={guess.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    border: "1px solid",
                    borderColor: guess.isCorrect ? "#bbf7d0" : "#e5e7eb",
                    background: guess.isCorrect ? "#f0fdf4" : "#f9fafb"
                  }}
                >
                  <div>
                    <strong style={{ color: "var(--ink)" }}>{guess.playerName}</strong>
                    <span style={{ margin: "0 8px", color: "var(--ink-soft)" }}>guessed</span>
                    <span style={{
                      fontWeight: 600,
                      color: guess.isCorrect ? "#166534" : "var(--ink)",
                      textDecoration: guess.isCorrect ? "underline" : "none"
                    }}>
                      "{guess.text}"
                    </span>
                  </div>
                  {guess.isCorrect && (
                    <span style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#166534",
                      background: "#dcfce7",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      textTransform: "uppercase"
                    }}>
                      Correct
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {error && <div className="form__error">{error}</div>}

      <div className="button-row button-row--spread">
        <span style={{ color: "var(--ink-soft)", fontSize: "0.875rem" }}>
          {isHost ? "You are the Host. Click restart to start a new game." : "Waiting for Host to restart game..."}
        </span>
        {isHost && (
          <button
            className="button button--primary"
            disabled={isLoading}
            onClick={handleRestart}
          >
            {isLoading ? "Restarting..." : "Restart Game"}
          </button>
        )}
      </div>
    </section>
  );
}
