import { useState } from "react";
import { useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  disabled?: boolean;
}

export function GuessForm({ disabled = false }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const roomStore = useRoomStore();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedGuess = guessText.trim();

    if (!trimmedGuess) {
      setError("Please enter a guess before submitting.");
      return;
    }

    setError(null);

    roomStore
      .submitGuess(trimmedGuess)
      .then(() => {
        setGuessText("");
      })
      .catch((submitError) => {
        const message = submitError instanceof Error ? submitError.message : "Unable to submit guess";
        setError(message);
      });
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
      {error ? <p className="form__error">{error}</p> : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
