import { useState } from "react";

interface GuessFormProps {
  onSubmit: (text: string) => Promise<void>;
  disabled?: boolean;
}

export function GuessForm({ onSubmit, disabled = false }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (guessText.trim() === "") {
      setError("Guess cannot be empty");
      return;
    }

    try {
      setError(null);
      await onSubmit(guessText.trim());
      setGuessText("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to submit guess");
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
          }}
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
