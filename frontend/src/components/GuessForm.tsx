import { useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  disabled?: boolean;
}

export function GuessForm({ disabled = false }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [guessError, setGuessError] = useState<string | null>(null);
  const [guessSuccess, setGuessSuccess] = useState<string | null>(null);
  const roomStore = useRoomStore();
  const { room } = useRoomState();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuessError(null);
    setGuessSuccess(null);

    const trimmed = guessText.trim();

    if (!trimmed) {
      setGuessError("Guess cannot be empty");
      return;
    }

    try {
      await roomStore.submitGuess(trimmed);
      setGuessText("");

      if (room?.secretWord && trimmed.toLowerCase() === room.secretWord.toLowerCase()) {
        setGuessSuccess("Correct! You guessed the word!");
      }
    } catch (caughtError) {
      setGuessError(caughtError instanceof Error ? caughtError.message : "Unable to submit guess");
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
      {guessError ? <p className="form__error">{guessError}</p> : null}
      {guessSuccess ? <p style={{ color: "#059669", fontSize: "0.875rem" }}>{guessSuccess}</p> : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
