import { useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  disabled?: boolean;
}

export function GuessForm({ disabled = false }: GuessFormProps) {
  const roomStore = useRoomStore();
  const { room } = useRoomState();
  const [guessText, setGuessText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled || !room) {
      return;
    }

    const trimmed = guessText.trim();

    if (!trimmed) {
      setValidationError("Guess cannot be empty");
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      await roomStore.submitGuess(trimmed);
      setGuessText("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit guess";
      setValidationError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (disabled) {
    return <p className="guess-form__disabled">The drawer cannot submit guesses.</p>;
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => {
            setGuessText(event.target.value);
            if (validationError) {
              setValidationError(null);
            }
          }}
          placeholder="Type your guess here..."
          disabled={isSubmitting}
        />
      </label>
      {validationError ? <p className="form__error">{validationError}</p> : null}
      <div className="button-row button-row--compact">
        <button
          className="button button--primary"
          type="submit"
          disabled={isSubmitting}
        >
          Submit Guess
        </button>
      </div>
    </form>
  );
}
