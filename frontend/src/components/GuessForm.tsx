import { useState } from "react";
import { api } from "../services/api";

interface GuessFormProps {
  roomCode: string;
  participantId: string;
  onGuess: () => void;
}

export function GuessForm({ roomCode, participantId, onGuess }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!guessText.trim()) {
      setError("Guess cannot be empty");
      return;
    }

    try {
      setError(null);
      await api.submitGuess(roomCode, participantId, guessText);
      setGuessText("");
      onGuess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit guess");
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
        />
      </label>
      {error ? <p className="form__error">{error}</p> : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit">
          Submit Guess
        </button>
      </div>
    </form>
  );
}
