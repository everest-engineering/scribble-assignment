import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useRoomStore } from "../state/roomStore";

const NAME_REGEX = /^[a-zA-Z0-9]+$/;

export function CreateRoomPage() {
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const navigate = useNavigate();
  const roomStore = useRoomStore();

  function validate(name: string): string | null {
    const trimmed = name.trim();

    if (trimmed.length === 0) {
      return "Player name is required";
    }

    if (trimmed.length > 16) {
      return "Player name must be 16 characters or less";
    }

    if (!NAME_REGEX.test(trimmed)) {
      return "Player name can only contain letters and numbers";
    }

    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = playerName.trim();
    const validationResult = validate(trimmed);

    if (validationResult) {
      setValidationError(validationResult);
      return;
    }

    setValidationError(null);

    try {
      setError(null);
      await roomStore.createRoom(trimmed);
      navigate("/lobby");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create room");
    }
  }

  return (
    <section className="panel panel--narrow placeholder-page">
      <PageHeader
        kicker="New lobby"
        title="Create Room"
        description="Pick a player name, create a room, and continue into the lobby."
      />
      <form className="form" onSubmit={handleSubmit}>
        <label className="form__field">
          <span>Player name</span>
          <input
            className="form__input"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Sketch captain"
          />
        </label>
        {validationError ? <p className="form__error">{validationError}</p> : null}
        {error ? <p className="form__error">{error}</p> : null}
        <div className="button-row">
          <button className="button button--primary" type="submit">
            Create and Continue
          </button>
          <button className="button button--secondary" type="button" onClick={() => navigate("/")}>
            Back
          </button>
        </div>
      </form>
    </section>
  );
}
