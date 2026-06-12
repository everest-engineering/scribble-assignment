import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useRoomStore } from "../state/roomStore";

function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Name is required";
  }
  if (trimmed.length > 30) {
    return "Name must be 30 characters or less";
  }
  return null;
}

export function CreateRoomPage() {
  const [playerName, setPlayerName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const navigate = useNavigate();
  const roomStore = useRoomStore();

  function handleNameChange(value: string) {
    setPlayerName(value);
    if (nameError) {
      setNameError(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateName(playerName);
    setNameError(validation);

    if (validation) {
      return;
    }

    try {
      setServerError(null);
      await roomStore.createRoom(playerName);
      navigate("/lobby");
    } catch (caughtError) {
      setServerError(caughtError instanceof Error ? caughtError.message : "Unable to create room");
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
            onChange={(event) => handleNameChange(event.target.value)}
            placeholder="Sketch captain"
          />
          {nameError ? <p className="form__error form__error--inline">{nameError}</p> : null}
        </label>
        {serverError ? <p className="form__error">{serverError}</p> : null}
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
