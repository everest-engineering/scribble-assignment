import { useState } from "react";
import { api } from "../services/api";
import {
  validateGuess,
  trimGuess,
  MAX_GUESS_LENGTH
} from "../utils/validation";

interface GuessFormProps {
  disabled?: boolean;
  roomCode?: string;
  participantId?: string;
}

export function GuessForm({
  disabled = false,
  roomCode,
  participantId
}: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const validation = validateGuess(guessText);
    if (validation) {
      setError(validation);
      return;
    }

    if (!roomCode || !participantId) {
      setError("Missing room or participant information.");
      return;
    }

    const text = trimGuess(guessText);
    setLoading(true);
    try {
      await api.postGuess(roomCode, participantId, text);
      setGuessText("");
    } catch (err: any) {
      if (err?.code === "ERR_GUESS_TOO_LONG") {
        setError("Guess is too long (server limit).");
      } else if (err?.status === 409) {
        setError(err.message || "Game not in progress.");
      } else {
        setError(err.message || "Unable to submit guess");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => {
            const val = event.target.value.slice(0, MAX_GUESS_LENGTH);
            setGuessText(val);
          }}
          placeholder="Type your guess here..."
          disabled={disabled || loading}
        />
        <div className="form__hint">
          {guessText.length}/{MAX_GUESS_LENGTH}
        </div>
      </label>
      {error ? <div className="form__error">{error}</div> : null}
      <div className="button-row button-row--compact">
        <button
          className="button button--primary"
          type="submit"
          disabled={disabled || loading}
        >
          {loading ? "Submitting..." : "Submit Guess"}
        </button>
      </div>
    </form>
  );
}
