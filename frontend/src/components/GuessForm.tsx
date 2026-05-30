import { useState } from "react";
import { useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  disabled?: boolean;
}

export function GuessForm({ disabled = false }: GuessFormProps) {
  const store = useRoomStore();
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = guessText.trim();

    if (!trimmed) {
      setError("Please enter a guess.");
      return;
    }

    setError(null);

    try {
      await store.submitGuess(trimmed);
      setGuessText("");
    } catch {
      // error already set in store; leave form as-is so user can retry
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
            if (error) setError(null);
          }}
          placeholder="Type your guess here..."
          disabled={disabled}
        />
      </label>
      {error && (
        <p style={{ color: "#dc2626", fontSize: "0.875rem", margin: "4px 0 0" }}>{error}</p>
      )}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
