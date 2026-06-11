import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function CreateRoomPage() {
  const [playerName, setPlayerName] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { isLoading } = useRoomState();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = playerName.trim();
    if (!trimmed) {
      setValidationError("Display name is required");
      return;
    }

    setValidationError(null);

    try {
      await roomStore.createRoom(trimmed);
      navigate("/lobby");
    } catch (caughtError) {
      setValidationError(caughtError instanceof Error ? caughtError.message : "Unable to create room");
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
            disabled={isLoading}
          />
        </label>
        {validationError ? <p className="form__error">{validationError}</p> : null}
        <div className="button-row">
          <button className="button button--primary" type="submit" disabled={isLoading}>
            {isLoading ? "Creating room..." : "Create and Continue"}
          </button>
          <button className="button button--secondary" type="button" onClick={() => navigate("/")} disabled={isLoading}>
            Back
          </button>
        </div>
      </form>
    </section>
  );
}
