import { useState } from "react";
import { useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  disabled?: boolean;
}

export function GuessForm({ disabled = false }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const store = useRoomStore();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await store.submitGuess(guessText);
      setGuessText("");
    } catch (error) {
      // ignore errors for now; store will surface messages
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => setGuessText(event.target.value)}
          placeholder="Type your guess here..."
          disabled={disabled}
        />
      </label>
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled || guessText.trim().length === 0}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
