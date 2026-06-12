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

function validateRoomCode(code: string): string | null {
  if (!code.trim()) {
    return "Room code is required";
  }
  return null;
}

export function JoinRoomPage() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const navigate = useNavigate();
  const roomStore = useRoomStore();

  function handleNameChange(value: string) {
    setPlayerName(value);
    if (nameError) {
      setNameError(null);
    }
  }

  function handleCodeChange(value: string) {
    setRoomCode(value.toUpperCase());
    if (codeError) {
      setCodeError(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nameValidation = validateName(playerName);
    const codeValidation = validateRoomCode(roomCode);

    setNameError(nameValidation);
    setCodeError(codeValidation);

    if (nameValidation || codeValidation) {
      return;
    }

    try {
      setServerError(null);
      await roomStore.joinRoom(roomCode.toUpperCase(), playerName);
      navigate("/lobby");
    } catch (caughtError) {
      setServerError(caughtError instanceof Error ? caughtError.message : "Unable to join room");
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
            onChange={(event) => handleNameChange(event.target.value)}
            placeholder="Second pencil"
          />
          {nameError ? <p className="form__error form__error--inline">{nameError}</p> : null}
        </label>

        <label className="form__field">
          <span>Room code</span>
          <input
            className="form__input form__input--code"
            value={roomCode}
            onChange={(event) => handleCodeChange(event.target.value)}
            placeholder="ABCD"
          />
          {codeError ? <p className="form__error form__error--inline">{codeError}</p> : null}
        </label>
        {serverError ? <p className="form__error">{serverError}</p> : null}
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
