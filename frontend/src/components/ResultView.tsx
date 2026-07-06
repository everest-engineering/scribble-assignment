import type { Participant, RoomSnapshot, ScoreMap } from "../services/api";
import { Card } from "./Card";
import { ResultPanel } from "./ResultPanel";
import { Scoreboard } from "./Scoreboard";

interface ResultViewProps {
  room: RoomSnapshot;
  participantId: string | null;
  isHost: boolean;
  onRestart: () => void;
}

export function ResultView({ room, participantId, isHost, onRestart }: ResultViewProps) {
  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Game Over</span>
          <h1 className="game-page__title">Final Results</h1>
        </div>
      </div>

      <div className="result-view__word">
        <Card title="The Word Was">
          <p className="result-view__word-text">{room.secretWord ?? "—"}</p>
        </Card>
      </div>

      <div className="result-view__content">
        <Scoreboard
          participants={room.participants}
          currentDrawerId={room.currentDrawerId}
          scores={room.scores}
        />
        <ResultPanel guesses={room.guesses} />
      </div>

      {isHost && (
        <div className="button-row">
          <button className="button button--primary" type="button" onClick={onRestart}>
            Restart Game
          </button>
        </div>
      )}
    </section>
  );
}
