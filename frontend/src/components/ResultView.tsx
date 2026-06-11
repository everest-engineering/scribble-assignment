import type { RoomSnapshot } from "../services/api";
import { GuessPanel } from "./GuessPanel";

interface ResultViewProps {
  room: RoomSnapshot;
  viewerParticipantId: string | null;
  onRestart?: () => Promise<unknown> | unknown;
}

export function ResultView({ room, viewerParticipantId, onRestart }: ResultViewProps) {
  if (room.status !== "result" || room.round === null) {
    return null;
  }

  const word = room.round.secretWord;

  return (
    <section className="result-view" data-testid="result-view">
      <header className="result-view__banner" data-testid="result-banner">
        <span className="result-view__round">Round {room.round.roundNumber} ended</span>
        <h2 className="result-view__title">
          The word was{" "}
          <span className="result-view__word" data-testid="result-word">
            {(word ?? "").toUpperCase()}
          </span>
        </h2>
      </header>

      <GuessPanel
        room={room}
        viewerParticipantId={viewerParticipantId}
        readOnly={true}
      />

      {room.viewerIsHost && (
        <button
          type="button"
          className="result-view__restart"
          onClick={() => onRestart?.()}
          data-testid="restart-button"
        >
          Restart room
        </button>
      )}
    </section>
  );
}
