import { useState } from "react";

interface GuessFormProps {
  disabled?: boolean;
  onSubmit?: (guess: string) => void;
  error?: string;
  lastResult?: "correct" | "incorrect";
}

export function GuessForm({ disabled = false, onSubmit, error, lastResult }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit?.(guessText.trim());
    setGuessText("");
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
      {lastResult ? (
        <p className={lastResult === "correct" ? "form__success" : "form__error"}>
          {lastResult === "correct" ? "Correct!" : "Incorrect!"}
        </p>
      ) : null}
      {error ? <p className="form__error">{error}</p> : null}

      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
