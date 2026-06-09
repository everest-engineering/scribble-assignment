import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useRoomStore } from "../state/roomStore";

export function JoinRoomPage() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ name?: string; code?: string }>({});
  const navigate = useNavigate();
  const roomStore = useRoomStore();

  function validate(): boolean {
    const errors: { name?: string; code?: string } = {};

    if (playerName.trim().length === 0) {
      errors.name = "Player name cannot be empty.";
    }

    if (roomCode.trim().length === 0) {
      errors.code = "Room code cannot be empty.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    try {
      await roomStore.joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
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
            onChange={(event) => { setPlayerName(event.target.value); setValidationErrors((prev) => ({ ...prev, name: undefined })); }}
            placeholder="Second pencil"
          />
          {validationErrors.name ? <p className="form__error">{validationErrors.name}</p> : null}
        </label>

        <label className="form__field">
          <span>Room code</span>
          <input
            className="form__input form__input--code"
            value={roomCode}
            onChange={(event) => { setRoomCode(event.target.value.toUpperCase()); setValidationErrors((prev) => ({ ...prev, code: undefined })); }}
            placeholder="ABCD"
          />
          {validationErrors.code ? <p className="form__error">{validationErrors.code}</p> : null}
        </label>
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
