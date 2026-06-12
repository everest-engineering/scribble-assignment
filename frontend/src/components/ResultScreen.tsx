import type { RoomSnapshot } from "../services/api";
import { Card } from "./Card";

interface ResultScreenProps {
  room: RoomSnapshot;
  participantId: string | null;
  onRestart?: () => void;
}

export function ResultScreen({ room, participantId, onRestart }: ResultScreenProps) {
  const viewer = room.participants.find((p) => p.id === participantId) ?? null;
  const isHost = participantId === room.hostId;

  const sortedParticipants = [...room.participants].sort(
    (a, b) => (room.scores[b.id] ?? 0) - (room.scores[a.id] ?? 0)
  );

  return (
    <div className="result-screen">
      <div className="result-screen__header">
        <span className="section-kicker">Round Complete</span>
        <h1 className="result-screen__title">Time's Up!</h1>
      </div>

      <div className="result-screen__word">
        <Card title="The Word Was">
          <p className="result-screen__secret-word">{room.secretWord ?? "Unknown"}</p>
        </Card>
      </div>

      <div className="result-screen__layout">
        <Card title="Final Scores">
          {sortedParticipants.length === 0 ? (
            <p>No participants.</p>
          ) : (
            <ol className="result-screen__score-list">
              {sortedParticipants.map((participant, index) => (
                <li key={participant.id} className="result-screen__score-item">
                  <span className="result-screen__score-rank">#{index + 1}</span>
                  <span className="result-screen__score-name">
                    {participant.name}{participant.id === viewer?.id ? " (You)" : ""}
                  </span>
                  <span className="result-screen__score-value">{room.scores[participant.id] ?? 0}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title="Guess History">
          {room.guessHistory.length === 0 ? (
            <p>No guesses were submitted this round.</p>
          ) : (
            <ul className="result-screen__guess-list">
              {room.guessHistory.map((guess) => (
                <li key={guess.id} className="result-screen__guess-item">
                  <span className="result-screen__guess-player">{guess.playerName}</span>
                  <span className="result-screen__guess-text">{guess.text}</span>
                  <span className={`result-screen__guess-result ${guess.correct ? "result-screen__guess-result--correct" : ""}`}>
                    {guess.correct ? "✓ +100" : "✗"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {isHost && (
        <div className="button-row">
          <button className="button button--primary" id="restart-button" onClick={onRestart}>
            Start New Round
          </button>
        </div>
      )}
    </div>
  );
}
