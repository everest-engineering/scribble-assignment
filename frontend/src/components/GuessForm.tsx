import { useState } from "react";
import { useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  disabled?: boolean;
}

export function GuessForm({ disabled = false }: GuessFormProps) {
  const [guess, setGuess] = useState("");
  const [error, setError] = useState<string | null>(null);
  const roomStore = useRoomStore();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = guess.trim();
    if (!trimmed) {
      setError("Guess is required");
      return;
    }

    try {
      setError(null);
      await roomStore.submitGuess(trimmed);
      setGuess("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to submit guess");
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <span>Your guess</span>
        <input
          className="form__input"
          value={guess}
          disabled={disabled}
          onChange={(event) => setGuess(event.target.value)}
          placeholder="Type your guess"
        />
      </label>
      {error ? <p className="form__error">{error}</p> : null}
      <button className="button button--primary" type="submit" disabled={disabled}>
        Submit Guess
      </button>
    </form>
  );
}
