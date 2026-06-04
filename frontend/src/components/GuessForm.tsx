import { useState } from "react";
import { useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  disabled?: boolean;
}

export function GuessForm({ disabled = false }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const roomStore = useRoomStore();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!guessText.trim()) return;

    try {
      await roomStore.submitGuess(guessText);
      setGuessText("");
    } catch (e) {
      console.error("Submit guess failed", e);
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
        <button className="button button--primary" type="submit" disabled={disabled || !guessText.trim()}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
