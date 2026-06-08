import { useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  disabled?: boolean;
}

export function GuessForm({ disabled = false }: GuessFormProps) {
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // A player who has already guessed correctly this round cannot score again
  // (FR-007), so the input is closed for them.
  const alreadyCorrect =
    room?.round?.guesses.some((guess) => guess.playerId === participantId && guess.correct) ?? false;
  const isClosed = disabled || alreadyCorrect;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Reject empty/whitespace-only guesses locally with a clear message (FR-003);
    // the server enforces the same rule.
    if (!guessText.trim()) {
      setError("Please enter a guess.");
      return;
    }

    setError(null);

    try {
      await roomStore.submitGuess(guessText);
      setGuessText("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to submit your guess.");
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => setGuessText(event.target.value)}
          placeholder={alreadyCorrect ? "You guessed it!" : "Type your guess here..."}
          disabled={isClosed}
        />
      </label>
      {error ? (
        <p className="form__error" style={{ color: "#b91c1c", fontSize: "0.875rem" }}>
          {error}
        </p>
      ) : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={isClosed}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
