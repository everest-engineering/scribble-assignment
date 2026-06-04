import { useEffect, useState, type FormEvent } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  disabled?: boolean;
}

export function GuessForm({ disabled = false }: GuessFormProps) {
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [guessText, setGuessText] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const viewer = room?.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = Boolean(room && participantId && (viewer?.role === "drawer" || viewer?.id === room.currentDrawerId));
  const hasGuessedCorrectly = Boolean(viewer?.hasGuessedCorrectly);
  const isFormDisabled = disabled || !room || !participantId || room.status !== "game" || isDrawer || hasGuessedCorrectly;

  useEffect(() => {
    if (hasGuessedCorrectly) {
      setGuessText("");
      setStatusMessage("You solved the word.");
    }
  }, [hasGuessedCorrectly]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedGuess = guessText.trim();

    if (!trimmedGuess) {
      setStatusMessage("Enter a guess before submitting.");
      return;
    }

    if (isFormDisabled) {
      return;
    }

    try {
      setStatusMessage(null);
      await roomStore.submitGuess(trimmedGuess);
      setGuessText("");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to submit guess");
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
          disabled={isFormDisabled}
        />
      </label>
      {statusMessage ? <p className="form__status">{statusMessage}</p> : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={isFormDisabled}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
