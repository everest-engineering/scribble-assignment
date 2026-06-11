import type { RoomSnapshot } from "../services/api";
import { GuessHistory } from "./GuessHistory";
import { RoomCodeBadge } from "./RoomCodeBadge";

interface ResultViewProps {
  room: RoomSnapshot;
  participantId: string | null;
  onRestart: () => void;
}

export function ResultView({ room, participantId, onRestart }: ResultViewProps) {
  const isHost = room.hostId === participantId;

  return (
    <section className="panel result-view">
      <div className="result-view__header">
        <div className="result-view__header-left">
          <span className="section-kicker">Round {room.roundNumber ?? "?"} Complete</span>
          <h1 className="result-view__title">Round Over!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="card">
        <div className="card__header">
          <h2>The word was</h2>
        </div>
        <div className="card__body">
          <p className="game-word-display">{room.correctWord ?? "???"}</p>
        </div>
      </div>

      <div className="result-view__content">
        <GuessHistory
          guesses={room.guesses}
          participants={room.participants}
          scores={room.scores}
        />
      </div>

      <div className="button-row">
        {isHost && (
          <button className="button button--primary" onClick={onRestart}>
            Restart Game
          </button>
        )}
        {!isHost && (
          <p className="text-muted">Waiting for host to restart...</p>
        )}
      </div>
    </section>
  );
}
