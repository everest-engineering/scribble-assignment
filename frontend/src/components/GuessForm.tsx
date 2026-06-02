import { useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  isDrawer?: boolean;
}

export function GuessForm({ isDrawer = false }: GuessFormProps) {
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const alreadyCorrect =
    participantId !== null && room !== null && room.guesses.some((g) => g.participantId === participantId && g.isCorrect);

  const disabled = isDrawer || alreadyCorrect || submitting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (disabled || !guessText.trim()) {
      if (!guessText.trim()) {
        setError("Guess cannot be empty");
      }
      return;
    }

    setSubmitting(true);
    try {
      await roomStore.submitGuess(guessText);
      setGuessText("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to submit guess");
    } finally {
      setSubmitting(false);
    }
  }

  if (isDrawer) {
    return <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>You are the drawer — watch the guesses roll in!</p>;
  }

  if (alreadyCorrect) {
    return <p style={{ color: "#059669", fontSize: "0.875rem", fontWeight: 600 }}>You guessed correctly! +100 points</p>;
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
      {error && <div className="form__error">{error}</div>}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled}>
          {submitting ? "Submitting..." : "Submit Guess"}
        </button>
      </div>
    </form>
  );
}
