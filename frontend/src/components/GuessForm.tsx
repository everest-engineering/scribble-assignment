import { useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  disabled?: boolean;
}

export function GuessForm({ disabled = false }: GuessFormProps) {
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isDrawer = room?.drawerId === participantId;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled || isDrawer) {
      return;
    }

    try {
      setError(null);
      await roomStore.submitGuess(guessText);
      setGuessText("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to submit guess",
      );
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => setGuessText(event.target.value)}
          placeholder={isDrawer ? "Drawer cannot guess" : "Type your guess here..."}
          disabled={disabled || isDrawer}
        />
      </label>
      {error ? <p className="form__error">{error}</p> : null}
      <div className="button-row button-row--compact">
        <button
          className="button button--primary"
          type="submit"
          disabled={disabled || isDrawer}
        >
          Submit Guess
        </button>
      </div>
    </form>
  );
}
