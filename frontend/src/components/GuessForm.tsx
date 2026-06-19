import { useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GuessForm() {
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const me = room?.participants.find((participant) => participant.id === participantId) ?? null;
  const alreadyCorrect = me?.score === 100;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = guessText.trim();

    if (!trimmed) {
      setError("Enter a guess.");
      return;
    }

    try {
      setError(null);
      await roomStore.submitGuess(trimmed);
      setGuessText("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to submit guess");
    }
  }

  if (alreadyCorrect) {
    return <p className="status-line" style={{ backgroundColor: "#dcfce7", color: "#15803d" }}>You guessed it! 🎉</p>;
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => setGuessText(event.target.value)}
          placeholder="Type your guess here..."
        />
      </label>
      {error ? <p className="form__error">{error}</p> : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit">
          Submit Guess
        </button>
      </div>
    </form>
  );
}
