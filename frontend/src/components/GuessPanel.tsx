import { useState, type FormEvent } from "react";
import type { RoomSnapshot } from "../services/api";

export const MAX_GUESS_LENGTH = 50;

export function isGuessSubmittable(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length >= 1 && trimmed.length <= MAX_GUESS_LENGTH;
}

interface GuessPanelProps {
  room: RoomSnapshot;
  viewerParticipantId: string | null;
  onSubmit?: (text: string) => Promise<unknown> | unknown;
  errorMessage?: string | null;
  readOnly?: boolean;
}

export function GuessPanel({
  room,
  viewerParticipantId,
  onSubmit,
  errorMessage,
  readOnly = false
}: GuessPanelProps) {
  const [value, setValue] = useState("");

  if (room.round === null) {
    return null;
  }

  const round = room.round;
  const viewerIsDrawer =
    viewerParticipantId !== null && viewerParticipantId === round.drawerParticipantId;
  const viewerIsLocked =
    viewerParticipantId !== null && round.lockedParticipantIds.includes(viewerParticipantId);

  const canSubmit = isGuessSubmittable(value);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !onSubmit) return;
    await onSubmit(value);
    setValue("");
  }

  return (
    <section className="guess-panel" data-testid="guess-panel">
      <section className="guess-panel__scoreboard" data-testid="scoreboard">
        <h3 className="guess-panel__heading">Scores</h3>
        <ul className="guess-panel__scoreboard-list">
          {room.participants.map((p) => (
            <li key={p.id} data-testid={`score-${p.id}`}>
              <span className="guess-panel__score-name">{p.name}</span>
              <span className="guess-panel__score-value">{round.scores[p.id] ?? 0}</span>
            </li>
          ))}
        </ul>
      </section>

      {!viewerIsDrawer && !readOnly && (
        <div className="guess-panel__input-area">
          {viewerIsLocked ? (
            <p className="guess-panel__locked" data-testid="guess-locked">
              You already guessed correctly this round.
            </p>
          ) : (
            <form className="guess-panel__form" onSubmit={handleSubmit}>
              <input
                className="guess-panel__input"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Type your guess"
                maxLength={MAX_GUESS_LENGTH + 1}
                aria-label="Guess"
                data-testid="guess-input"
              />
              <button
                type="submit"
                className="guess-panel__submit"
                disabled={!canSubmit}
                data-testid="guess-submit"
              >
                Submit
              </button>
            </form>
          )}
          {errorMessage && (
            <p className="guess-panel__error" data-testid="guess-error">
              {errorMessage}
            </p>
          )}
        </div>
      )}

      <section className="guess-panel__feed" data-testid="guess-feed">
        <h3 className="guess-panel__heading">Guesses</h3>
        {round.guesses.length === 0 ? (
          <p className="guess-panel__empty">No guesses yet.</p>
        ) : (
          <ul className="guess-panel__feed-list">
            {round.guesses.map((g) => (
              <li
                key={g.id}
                className={`guess-panel__feed-item guess-panel__feed-item--${
                  g.isCorrect ? "correct" : "wrong"
                }`}
                data-testid={`guess-${g.id}`}
              >
                <span className="guess-panel__feed-name">{g.displayName}</span>
                <span className="guess-panel__feed-text">{g.text}</span>
                <span className="guess-panel__feed-verdict">
                  {g.isCorrect ? "Correct" : "Wrong"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
