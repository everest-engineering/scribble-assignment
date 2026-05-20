import { Card } from "./Card";
import { Canvas } from "./Canvas";
import { ResultPanel } from "./ResultPanel";
import { Scoreboard } from "./Scoreboard";
import type { RoomSnapshot } from "../services/api";

interface ResultViewProps {
  room: RoomSnapshot;
  participantId: string | null;
  isHost: boolean;
  onRestart: () => void;
}

export function ResultView({ room, participantId, isHost, onRestart }: ResultViewProps) {
  const secretWord = room.currentRound?.secretWord ?? "???";
  const guesserCount = room.participants.length - 1;
  const allCorrect = guesserCount > 0 && (room.currentRound?.correctGuessers.length ?? 0) >= guesserCount;
  const roundEndLabel = allCorrect ? "Everyone Guessed It!" : "Time's Up!";
  const finalScores: Record<string, number> = {};
  for (const [pid, score] of Object.entries(room.cumulativeScores)) {
    finalScores[pid] = score;
  }
  if (room.currentRound) {
    for (const [pid, score] of Object.entries(room.currentRound.scores)) {
      finalScores[pid] = (finalScores[pid] ?? 0) + score;
    }
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {room.currentRound?.number ?? 1} — {allCorrect ? "All Correct" : "Timed Out"}</span>
          <h1 className="game-page__title">{roundEndLabel}</h1>
        </div>
        <div className="room-code-badge">{room.code}</div>
      </div>

      <Card title="The word was">
        <p style={{ fontSize: "2rem", fontWeight: "bold", textAlign: "center", margin: "1rem 0" }}>
          {secretWord}
        </p>
      </Card>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard
            participants={room.participants}
            scores={finalScores}
          />
          <ResultPanel
            guesses={room.currentRound?.guesses ?? []}
          />
        </aside>

        <div className="game-page__main">
          <Card title="Final Canvas">
            <Canvas
              strokes={room.currentRound?.strokes ?? []}
              isDrawer={false}
              onStroke={() => {}}
              onClear={() => {}}
            />
          </Card>
        </div>
      </div>

      <div className="button-row">
        {isHost && (
          <button className="button button--primary" onClick={onRestart}>
            Restart Game
          </button>
        )}
        {!isHost && (
          <p style={{ textAlign: "center", color: "#6b7280", fontSize: "0.875rem" }}>
            Waiting for host to restart...
          </p>
        )}
      </div>
    </section>
  );
}
