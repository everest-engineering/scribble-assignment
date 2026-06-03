import { useState } from "react";
import { api } from "../services/api";

interface GuessFormProps {
  roomCode: string;
  participantId: string;
}

export function GuessForm({ roomCode, participantId }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(
    null,
  );
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFeedback(null);

    if (guessText.trim().length === 0) {
      setError("Guess cannot be empty.");
      return;
    }

    setPending(true);
    try {
      const { guess } = await api.submitGuess(
        roomCode,
        participantId,
        guessText,
      );
      setFeedback(guess.correct ? "correct" : "incorrect");
      setGuessText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit guess.");
    } finally {
      setPending(false);
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
            setFeedback(null);
          }}
          placeholder="Type your guess here..."
          disabled={pending}
        />
      </label>
      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}
      {feedback === "correct" && (
        <p className="form__success" role="alert">
          Correct! 🎉
        </p>
      )}
      {feedback === "incorrect" && (
        <p className="form__hint" role="alert">
          Not quite — keep trying!
        </p>
      )}
      <div className="button-row button-row--compact">
        <button
          className="button button--primary"
          type="submit"
          disabled={pending}
        >
          {pending ? "Submitting…" : "Submit Guess"}
        </button>
      </div>
    </form>
  );
}
