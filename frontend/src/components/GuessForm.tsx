import { useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  disabled?: boolean;
}

export function GuessForm({ disabled = false }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const store = useRoomStore();
  const { room, participantId } = useRoomState();

  const viewer = room?.participants.find((p) => p.id === participantId) ?? null;
  const isDrawer = viewer?.role === "drawer";
  const canSubmit = !disabled && !!room && room.status === "active" && !isDrawer;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError(null);
      const trimmed = guessText.trim();
      if (trimmed.length === 0) {
        setError("Guess cannot be empty");
        return;
      }

      await store.submitGuess(trimmed);
      setGuessText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit guess");
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => setGuessText(event.target.value)}
          placeholder={isDrawer ? "You are the drawer" : "Type your guess here..."}
          disabled={!canSubmit}
        />
      </label>
      {error ? <p className="form__error">{error}</p> : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={!canSubmit}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
