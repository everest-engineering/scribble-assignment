import { useState } from "react";
import { useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  disabled?: boolean;
}

export function GuessForm({ disabled = false }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const roomStore = useRoomStore();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = guessText.trim();
    if (submitting) return;

    if (!trimmed) {
      setFormError("Please enter a guess.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await roomStore.submitGuess(trimmed);
      setGuessText("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to submit guess");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {formError && <div className="form__error">{formError}</div>}
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => {
            setGuessText(event.target.value);
            if (formError) setFormError(null);
          }}
          placeholder="Type your guess here..."
          disabled={disabled || submitting}
        />
      </label>
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled || submitting}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
