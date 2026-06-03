import { useState } from "react";
import type { RoomSnapshot } from "../services/api";
import { useRoomStore } from "../state/roomStore";
import { Card } from "./Card";
import { GuessHistory } from "./GuessHistory";
import { Scoreboard } from "./Scoreboard";

interface ResultPanelProps {
  room: RoomSnapshot;
}

export function ResultPanel({ room }: ResultPanelProps) {
  const roomStore = useRoomStore();
  const [error, setError] = useState<string | null>(null);

  const isHost = room.viewer?.isHost ?? false;
  const winner = room.participants.find((participant) => participant.id === room.guesses.find((guess) => guess.correct)?.participantId);

  async function handleRestart() {
    try {
      setError(null);
      await roomStore.restart();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to restart");
    }
  }

  return (
    <div className="result-panel">
      <Card title="Round Over">
        <p className="word-banner">
          The word was <strong>{room.word ?? "—"}</strong>.
        </p>
        <p className="result-panel__winner">
          {winner ? `${winner.name} guessed it first! (+100)` : "Nobody guessed the word."}
        </p>
        {isHost ? (
          <div className="button-row button-row--compact">
            <button className="button button--primary" type="button" onClick={handleRestart}>
              Restart Game
            </button>
          </div>
        ) : (
          <p className="status-line">Waiting for the host to restart…</p>
        )}
        {error ? <p className="form__error">{error}</p> : null}
      </Card>

      <Scoreboard participants={room.participants} />
      <GuessHistory guesses={room.guesses} />
    </div>
  );
}
