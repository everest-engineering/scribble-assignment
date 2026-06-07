import { useState } from "react";

interface GuessFormProps {
  disabled?: boolean;
  onSubmitGuess?: (text: string) => Promise<void>;
}

export function GuessForm({ disabled = false, onSubmitGuess }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = guessText.trim();
    if (!trimmed) {
      setError("Guess cannot be empty");
      return;
    }
    setError(null);
    try {
      await onSubmitGuess?.(trimmed);
      setGuessText("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to submit guess");
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
      {error && <p className="form__error">{error}</p>}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
