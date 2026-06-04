import { useState } from "react";

interface GuessFormProps {
  onSubmit?: (text: string) => void;
  disabled?: boolean;
}

export function GuessForm({ onSubmit, disabled = false }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = guessText.trim();
    if (!trimmed) {
      setLocalError("Guess cannot be empty");
      return;
    }

    setLocalError(null);
    onSubmit?.(trimmed);
    setGuessText("");
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => {
            setGuessText(event.target.value);
            if (localError) setLocalError(null);
          }}
          placeholder="Type your guess here..."
          disabled={disabled}
        />
      </label>
      {localError ? <p className="form__error">{localError}</p> : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
