import { useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  disabled?: boolean;
}

export function GuessForm({ disabled = false }: GuessFormProps) {
  const roomStore = useRoomStore();
  const { isLoading } = useRoomState();
  const [guessText, setGuessText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<"correct" | "incorrect" | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);
    setSubmitError(null);
    setLastResult(null);

    const trimmed = guessText.trim();
    if (trimmed.length === 0) {
      setValidationError("Guess cannot be empty.");
      return;
    }

    try {
      const result = await roomStore.submitGuess(trimmed);
      setLastResult(result.correct ? "correct" : "incorrect");
      setGuessText("");
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error ? caughtError.message : "Failed to submit guess"
      );
    }
  }

  const isDisabled = disabled || isLoading;

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          id="guess-input"
          className="form__input"
          value={guessText}
          onChange={(event) => {
            setGuessText(event.target.value);
            setValidationError(null);
            setLastResult(null);
          }}
          placeholder="Type your guess here..."
          disabled={isDisabled}
          autoComplete="off"
        />
      </label>

      {validationError && (
        <p style={{ color: "#dc2626", fontSize: "0.85em", marginTop: "4px" }}>
          {validationError}
        </p>
      )}
      {submitError && (
        <p style={{ color: "#dc2626", fontSize: "0.85em", marginTop: "4px" }}>
          {submitError}
        </p>
      )}
      {lastResult === "correct" && (
        <p style={{ color: "#16a34a", fontSize: "0.85em", marginTop: "4px", fontWeight: 600 }}>
          ✓ Correct! +100 points
        </p>
      )}
      {lastResult === "incorrect" && (
        <p style={{ color: "#b45309", fontSize: "0.85em", marginTop: "4px" }}>
          ✗ Not quite — keep trying!
        </p>
      )}

      <div className="button-row button-row--compact">
        <button
          id="submit-guess-btn"
          className="button button--primary"
          type="submit"
          disabled={isDisabled}
        >
          Submit Guess
        </button>
      </div>
    </form>
  );
}
