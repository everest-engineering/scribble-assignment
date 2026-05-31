import { useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  disabled?: boolean;
}

export function GuessForm({ disabled = false }: GuessFormProps) {
  const roomStore = useRoomStore();
  const { error } = useRoomState();
  const [guessText, setGuessText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!guessText.trim()) {
      setLocalError("Guess cannot be empty");
      return;
    }

    setLocalError(null);
    await roomStore.submitGuess(guessText);
    setGuessText("");
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => {
            setGuessText(event.target.value);
            if (localError) setLocalError(null);
          }}
          placeholder="Type your guess here..."
          disabled={disabled}
        />
      </label>
      {(localError ?? error) ? <p className="form__error">{localError ?? error}</p> : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}