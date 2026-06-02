import { useNavigate } from "react-router-dom";
import { useRoomState, useRoomStore } from "../state/roomStore";
import { Card } from "./Card";

export function ResultView() {
  const navigate = useNavigate();
  const { room, participantId } = useRoomState();
  const roomStore = useRoomStore();

  if (!room) return null;

  const isHost = participantId !== null && room.hostId === participantId;
  const guesses = room.guesses ?? [];

  return (
    <section className="panel result-view">
      <div className="result-view__header">
        <span className="section-kicker">Round {room.roundNumber} — Complete</span>
        <h1 className="result-view__title">Round over!</h1>
      </div>

      <Card title="The word was">
        <div className="result-view__word">{room.secretWord ?? "???"}</div>
      </Card>

      <div className="result-view__layout">
        <Card title="Final Scores">
          {room.participants.length === 0 ? (
            <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
              <span>No participants</span>
            </div>
          ) : (
            <div className="scoreboard-list">
              {room.participants.map((participant) => (
                <div key={participant.id} className="scoreboard-row">
                  <span className="scoreboard-name">{participant.name}</span>
                  <strong className="scoreboard-value">{room.scores[participant.id] ?? 0}</strong>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title={guesses.length > 0 ? `Guesses (${guesses.length})` : "Guesses"}>
          {guesses.length === 0 ? (
            <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
              <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                No guesses were made this round.
              </p>
            </div>
          ) : (
            <div className="guess-history">
              {guesses.map((guess, index) => (
                <div
                  key={index}
                  className={`guess-entry ${guess.isCorrect ? "guess-entry--correct" : "guess-entry--incorrect"}`}
                >
                  <span className="guess-entry__name">{guess.participantName}</span>
                  <span className="guess-entry__text">{guess.text}</span>
                  <span className="guess-entry__result">
                    {guess.isCorrect ? "+100 ✓" : "✗"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit to Lobby
        </button>
        {isHost && (
          <button className="button button--primary" onClick={() => roomStore.restartGame()}>
            Restart Game
          </button>
        )}
      </div>
    </section>
  );
}