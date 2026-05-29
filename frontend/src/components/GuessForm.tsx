import { useState } from "react";
import { useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  disabled?: boolean;
}

export function GuessForm({ disabled = false }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const roomStore = useRoomStore();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    const trimmed = guessText.trim();
    if (!trimmed) return;

    try {
      setError(null);
      await roomStore.submitGuess(trimmed);
      setGuessText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit guess");
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
      {error && <p className="form__error" style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{error}</p>}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled || !guessText.trim()}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
