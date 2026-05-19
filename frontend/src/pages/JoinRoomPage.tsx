import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useRoomStore } from "../state/roomStore";

const NAME_REGEX = /^[a-zA-Z0-9]+$/;
const CODE_REGEX = /^[A-Z0-9]+$/;

export function JoinRoomPage() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const navigate = useNavigate();
  const roomStore = useRoomStore();

  function validate(name: string, code: string): string | null {
    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      return "Player name is required";
    }

    if (trimmedName.length > 16) {
      return "Player name must be 16 characters or less";
    }

    if (!NAME_REGEX.test(trimmedName)) {
      return "Player name can only contain letters and numbers";
    }

    const trimmedCode = code.trim();

    if (trimmedCode.length === 0) {
      return "Room code is required";
    }

    if (!CODE_REGEX.test(trimmedCode)) {
      return "Room code contains invalid characters";
    }

    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedCode = roomCode.trim();
    const trimmedName = playerName.trim();
    const validationResult = validate(trimmedName, trimmedCode);

    if (validationResult) {
      setValidationError(validationResult);
      return;
    }

    setValidationError(null);

    try {
      setError(null);
      await roomStore.joinRoom(trimmedCode, trimmedName);
      navigate("/lobby");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to join room");
    }
  }

  return (
    <section className="panel panel--narrow placeholder-page">
      <PageHeader
        kicker="Existing lobby"
        title="Join Room"
        description="Enter your player name and the room code to join an existing lobby."
      />
      <form className="form" onSubmit={handleSubmit}>
        <label className="form__field">
          <span>Player name</span>
          <input
            className="form__input"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Second pencil"
          />
        </label>

        <label className="form__field">
          <span>Room code</span>
          <input
            className="form__input form__input--code"
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
            placeholder="ABCD"
          />
        </label>
        {validationError ? <p className="form__error">{validationError}</p> : null}
        {error ? <p className="form__error">{error}</p> : null}
        <div className="button-row">
          <button className="button button--primary" type="submit">
            Join Lobby
          </button>
          <button className="button button--secondary" type="button" onClick={() => navigate("/")}>
            Back
          </button>
        </div>
      </form>
    </section>
  );
}
