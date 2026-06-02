import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function CreateRoomPage() {
  const [playerName, setPlayerName] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { isLoading, error } = useRoomState();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (playerName.trim().length === 0) {
      setValidationError("Name cannot be empty.");
      return;
    }

    setValidationError(null);

    try {
      await roomStore.createRoom(playerName.trim());
      navigate("/lobby");
    } catch {
      // error displayed from store state
    }
  }

  const displayError = validationError ?? error;

  return (
    <section className="panel panel--narrow">
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
            onChange={(event) => {
              setPlayerName(event.target.value);
              setValidationError(null);
            }}
            placeholder="Sketch captain"
            disabled={isLoading}
          />
        </label>
        {displayError ? <p className="form__error">{displayError}</p> : null}
        <div className="button-row">
          <button className="button button--primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner" aria-label="Creating room…" />
                Creating…
              </>
            ) : (
              "Create and Continue"
            )}
          </button>
          <button
            className="button button--secondary"
            type="button"
            disabled={isLoading}
            onClick={() => navigate("/")}
          >
            Back
          </button>
        </div>
      </form>
    </section>
  );
}
