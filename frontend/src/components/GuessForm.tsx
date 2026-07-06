import { useState } from "react";
import { useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  disabled?: boolean;
  guessedCorrectly?: boolean;
  pointsAwarded?: number;
}

export function GuessForm({ disabled = false, guessedCorrectly = false, pointsAwarded = 0 }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const roomStore = useRoomStore();

  if (guessedCorrectly) {
    const label = pointsAwarded > 0 ? `Score: +${pointsAwarded}` : "0 points added.";
    return (
      <div className="guess-form__correct">
        <p>You guessed correctly! {label}</p>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const trimmed = guessText.trim();
    if (!trimmed) {
      setError("Please enter a guess before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await roomStore.submitGuess(trimmed);
      setGuessText("");
      if (response.message) {
        setMessage(response.message);
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage("Guess submitted!");
        setTimeout(() => setMessage(null), 2000);
      }
    } catch (err) {
      const text = err instanceof Error ? err.message : "Unable to submit guess";
      setError(text);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => {
            setGuessText(event.target.value);
            setError(null);
            setMessage(null);
          }}
          placeholder="Type your guess here..."
          disabled={disabled || submitting}
        />
      </label>
      {error && <p className="form__error">{error}</p>}
      {message && <p className="form__success">{message}</p>}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled || submitting}>
          {submitting ? "Submitting..." : "Submit Guess"}
        </button>
      </div>
    </form>
  );
}
